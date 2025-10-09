# Guía de Deploy en VPS

Esta guía describe cómo instalar y ejecutar **Panel de Reclutamiento Inteligente** en un servidor VPS basado en Linux (por ejemplo, Ubuntu 22.04). Los pasos cubren la instalación de dependencias, preparación del entorno, despliegue del backend/frontend de Next.js y servicios auxiliares como PostgreSQL y n8n.

> **Nota:** Adapta los comandos a la distribución específica de tu VPS. Se asume que cuentas con acceso SSH con privilegios de `sudo`.

---

## 1. Preparar el servidor

1. **Actualizar paquetes del sistema**
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```
2. **Instalar utilidades básicas**
   ```bash
   sudo apt install -y build-essential curl git ufw
   ```

---

## 2. Instalar Node.js y pnpm

1. **Instalar Node.js LTS (20.x)** usando el script oficial:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt install -y nodejs
   ```
2. **Instalar pnpm** globalmente:
   ```bash
   sudo npm install -g pnpm
   ```
3. **Verificar versiones**
   ```bash
   node -v
   pnpm -v
   ```

---

## 3. Instalar y configurar PostgreSQL

1. **Instalar PostgreSQL**
   ```bash
   sudo apt install -y postgresql postgresql-contrib
   ```
2. **Crear usuario y base de datos**
   ```bash
   sudo -u postgres createuser --interactive --pwprompt recruitment_admin
   sudo -u postgres createdb -O recruitment_admin recruitment_db
   ```
3. **Habilitar acceso remoto (opcional)**
   - Edita `/etc/postgresql/14/main/postgresql.conf` y habilita `listen_addresses = '*'`.
   - Añade reglas en `/etc/postgresql/14/main/pg_hba.conf` según tus necesidades de red.
   - Reinicia PostgreSQL: `sudo systemctl restart postgresql`.

> Ajusta los nombres de usuario/base de datos y las versiones de PostgreSQL según el entorno.

---

## 4. Desplegar n8n (Docker recomendado)

1. **Instalar Docker y Docker Compose**
   ```bash
   curl -fsSL https://get.docker.com | sudo sh
   sudo usermod -aG docker $USER
   newgrp docker
   sudo apt install -y docker-compose-plugin
   ```
2. **Crear un archivo `docker-compose.yml` básico para n8n**
   ```yaml
   version: "3.7"
   services:
     n8n:
       image: n8nio/n8n:latest
       restart: unless-stopped
       ports:
         - "5678:5678"
       volumes:
         - ./n8n_data:/home/node/.n8n
       environment:
         - GENERIC_TIMEZONE=America/Mexico_City
         - N8N_ENCRYPTION_KEY=<clave-aleatoria>
   ```
3. **Levantar n8n**
   ```bash
   mkdir -p ~/services/n8n
   cd ~/services/n8n
   nano docker-compose.yml # pega el contenido anterior
   docker compose up -d
   ```
4. **Configurar Webhook**
   - Desde la interfaz de n8n (puerto `5678`), crea el workflow indicado en la guía de desarrollo.
   - Copia la URL del webhook para usarla en la app Next.js (`N8N_WEBHOOK_URL`).

---

## 5. Configurar el cortafuegos (UFW)

1. **Permitir SSH y puertos necesarios**
   ```bash
   sudo ufw allow OpenSSH
   sudo ufw allow 3000/tcp   # Next.js
   sudo ufw allow 5678/tcp   # n8n
   sudo ufw enable
   sudo ufw status
   ```

> Ajusta los puertos según el proxy inverso que utilices (Nginx, Caddy, etc.).

---

## 6. Clonar el repositorio y preparar el entorno

1. **Clonar el repositorio**
   ```bash
   cd /var/www
   sudo mkdir -p panel-reclutamiento
   sudo chown $USER:$USER panel-reclutamiento
   cd panel-reclutamiento
   git clone https://github.com/tu-org/oss-ats.git .
   ```
2. **Instalar dependencias**
   ```bash
   pnpm install
   ```
3. **Configurar variables de entorno**
   - Copia `.env.example` (o el archivo de plantilla disponible) a `.env.production`.
   - Configura las variables:
     ```ini
     DATABASE_URL="postgresql://recruitment_admin:tu_password@localhost:5432/recruitment_db"
     NEXTAUTH_SECRET="clave-secreta"
     NEXTAUTH_URL="https://tu-dominio"
     N8N_WEBHOOK_URL="https://tu-dominio-n8n/webhook/ia-candidate"
     N8N_CALLBACK_SECRET="token-compartido"
     STORAGE_PATH="/var/www/panel-reclutamiento/storage"
     ```
   - Ajusta y añade variables adicionales según `Guía de Desarrollo Detallada.md`.
4. **Crear directorios necesarios**
   ```bash
   mkdir -p storage/uploads
   ```

---

## 7. Ejecutar migraciones de Prisma

```bash
pnpm prisma migrate deploy --schema prisma/schema.prisma
```

> Asegúrate de que la variable `DATABASE_URL` esté disponible en el entorno al ejecutar el comando.

---

## 8. Construir y ejecutar la aplicación Next.js

1. **Build de producción**
   ```bash
   pnpm build
   ```
2. **Ejecutar en modo producción**
   ```bash
   pnpm start -- -p 3000
   ```
3. **(Opcional) Ejecutar con PM2 para mantener el proceso activo**
   ```bash
   sudo npm install -g pm2
   pm2 start pnpm --name "panel-reclutamiento" -- start -- -p 3000
   pm2 save
   pm2 startup systemd
   ```

---

## 9. Configurar un proxy inverso (Nginx)

1. **Instalar Nginx**
   ```bash
   sudo apt install -y nginx
   ```
2. **Crear configuración básica** en `/etc/nginx/sites-available/panel-reclutamiento`:
   ```nginx
   server {
     listen 80;
     server_name tu-dominio.com;

     location / {
       proxy_pass http://127.0.0.1:3000;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection 'upgrade';
       proxy_set_header Host $host;
       proxy_cache_bypass $http_upgrade;
     }
   }
   ```
3. **Activar y reiniciar**
   ```bash
   sudo ln -s /etc/nginx/sites-available/panel-reclutamiento /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```
4. **Configurar HTTPS con Certbot**
   ```bash
   sudo apt install -y certbot python3-certbot-nginx
   sudo certbot --nginx -d tu-dominio.com
   ```

---

## 10. Configurar tareas automáticas

- **Backups de la base de datos**: crea un cron job para ejecutar `pg_dump` periódicamente.
- **Logs y monitoreo**: considera integrar herramientas como `pm2 monit`, Grafana, o servicios externos.
- **Actualizaciones**: programa actualizaciones periódicas para aplicar parches de seguridad (`sudo apt upgrade`).

---

## 11. Flujo de despliegue continuo (opcional)

1. Usa GitHub Actions o cualquier CI/CD para construir y ejecutar pruebas (`pnpm lint`, `pnpm test`).
2. Empuja al VPS mediante `ssh` y `git pull` o despliega artefactos (`rsync`, `scp`).
3. Después de actualizar el código:
   ```bash
   pnpm install --frozen-lockfile
   pnpm prisma migrate deploy
   pnpm build
   pm2 restart panel-reclutamiento
   ```

---

## 12. Solución de problemas comunes

| Problema | Posible causa | Solución |
|----------|---------------|----------|
| Error al conectar a la BD | Credenciales incorrectas o puerto bloqueado | Verifica `DATABASE_URL`, reinicia PostgreSQL, revisa firewall |
| `pnpm build` falla | Variables de entorno faltantes | Carga el archivo `.env.production` y exporta las variables |
| Upload de CV no funciona | Permisos del directorio de almacenamiento | Asegura que el usuario de la app tenga permisos sobre `storage/uploads` |
| n8n no puede llamar al callback | `N8N_CALLBACK_SECRET` incorrecto o puerto bloqueado | Revisa la configuración del workflow y reglas UFW |

---

## 13. Checklist post-deploy

- [ ] Aplicación accesible via HTTPS
- [ ] Migraciones ejecutadas correctamente
- [ ] Webhook de n8n funcionando (probar con un CV de ejemplo)
- [ ] Logs de la app sin errores críticos
- [ ] Backups automáticos configurados

Con estos pasos tu VPS quedará listo para ejecutar el Panel de Reclutamiento Inteligente, integrando Next.js, PostgreSQL y n8n con la orquestación de IA requerida.

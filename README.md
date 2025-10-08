# Panel de Reclutamiento Inteligente

![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)

![Open Source ATS Platform](./src/public/ats-oss.png)

Este repositorio es una adaptación del proyecto open source `oss-ats` para construir el
**Panel de Reclutamiento Inteligente**, una plataforma moderna para reclutadores que
aprovecha flujos automatizados con n8n y análisis generativo a través de la API de
Google Gemini (orquestada externamente).

## Demo

A live demo of the project can be found [here](https://demo.ats-oss.org/), the admin
password is `admin`.

## Funcionalidades Destacadas

- Gestión de contexto estratégico de la compañía (visión, misión, valores y tono).
- Registro y seguimiento de candidatos con historial JSON y estados personalizables.
- Procesos de selección dinámicos con tableros Kanban derivados de planes de entrevista.
- Flujo "Añadir Perfil con IA" que sube CVs, crea candidatos en estado `processing` y
  delega el enriquecimiento de información a un workflow de n8n.
- Captura de feedback estructurado de entrevistadores vinculado a cada proceso.
- Autenticación basada en roles (Reclutador, Gerente de Área y Entrevistador) para
  asegurar el acceso a los diferentes módulos.

## Stack Tecnológico

- Next.js con TypeScript y Tailwind CSS.
- PostgreSQL como base de datos con Prisma ORM.
- NextAuth.js (o proveedor nativo) para autenticación y control de roles.
- n8n como motor de automatización y orquestación de Gemini.
- Almacenamiento temporal de CVs gestionado por Next.js antes de delegar a n8n.

## Local Development

You will need to have `pnpm` and `docker-compose` installed on your machine.

1. Install dependencies
  ```bash
  pnpm install
  ```

2. Set up environment variables
  ```bash
  cp .env.example .env
  ```

3. Start local services (Postgres and Minio)
  ```bash
  docker-compose up -d
  ```

4. Run database migrations
  ```bash
  pnpm migrate
  ```

5. Start development server
  ```bash
  pnpm dev
  ```

## Guías Adicionales

- [`Guia-Deploy.md`](./Guia-Deploy.md): guía paso a paso para desplegar la aplicación en un VPS.

## Contribuciones Recientes

Las siguientes implementaciones forman parte de la personalización del Panel de
Reclutamiento Inteligente:

- Rediseño del esquema de Prisma para soportar contexto estratégico, candidatos y
  procesos con datos estructurados en JSON.
- Endpoints protegidos por roles para gestionar contexto, candidatos, procesos y
  feedback, además del callback seguro proveniente de n8n.
- Flujo de subida de CVs que dispara un webhook en n8n y recibe actualizaciones a través
  de callbacks autenticados.
- Componentes React con Tailwind para los módulos de Contexto Estratégico, Kanban de
  entrevistas y formulario de feedback.

## License

This project is licensed under GNU GPLv3.

### Why GPL?

The whole point of this project is that there's so many ATS platforms out there that are either 
too expensive, too complicated, or too restrictive. This project aims to be a simple, open-source alternative 
that can be self-hosted and customized to your needs.

For that reason, I've chosen the GNU GPLv3 license to ensure that any modifications or improvements made to this project
are shared back with the community. This is to prevent any one entity from taking the project and making it proprietary.

## Contributing

Contributions are welcome! Just create an issue or pull request and I'll take a look.

# **Guía de Desarrollo Detallada: Panel de Reclutamiento Inteligente**

Versión: 4.0 (Versión de Producción)  
Fecha: 6 de Octubre, 2025

### **1\. Visión General del Proyecto**

#### **Concepto**

El "Panel de Reclutamiento Inteligente" es una aplicación web integral diseñada para transformar el proceso de adquisición de talento. La plataforma va más allá de la simple gestión de vacantes, incorporando un sistema proactivo de sourcing, un flujo de entrevistas colaborativo y una capa de inteligencia artificial (Google Gemini) que asiste en cada etapa, desde la redacción de ofertas hasta la toma de decisiones basada en datos.

#### **Propuesta de Valor**

* **Estrategia Centralizada:** El Módulo de Contexto Estratégico asegura que cada interacción de la IA (descripciones de puesto, comunicaciones, análisis) esté perfectamente alineada con la visión, misión, valores y tono de la empresa.  
* **Inteligencia Aplicada:** La IA no solo genera texto, sino que extrae datos estructurados de documentos, analiza la compatibilidad de perfiles, sugiere preguntas de entrevista contextualmente relevantes y ofrece análisis comparativos para facilitar decisiones objetivas.  
* **Colaboración Fluida:** El sistema de roles (Reclutador, Gerente, Entrevistador) y el flujo de entrevistas basado en un tablero Kanban garantizan que cada participante sepa exactamente qué hacer y cuándo hacerlo, centralizando todo el feedback en un único lugar.  
* **Eficiencia Exponencial:** Automatiza las tareas de bajo valor (redacción de borradores, extracción de datos de CVs) y acelera las de alto valor (identificación de talento, preparación de entrevistas), reduciendo el tiempo de contratación y mejorando la calidad de la misma.

### **2\. Arquitectura Tecnológica**

* **Frontend:**  
  * **Framework:** HTML5, JavaScript (ES6 Modules). La estructura de un solo archivo es para el prototipo; se recomienda migrar a un framework como **Vue.js** o **React** para la versión de producción para gestionar la complejidad del estado y los componentes.  
  * **Estilos:** **Tailwind CSS**. Proporciona un sistema de utilidades que acelera el desarrollo de una interfaz consistente y responsiva.  
* **Backend (BaaS \- Backend as a Service):**  
  * **Proveedor:** **Google Firebase**.  
  * **Base de Datos:** **Firestore**. Seleccionada por su naturaleza NoSQL (flexible), su capacidad de escucha en tiempo real (onSnapshot) que simplifica la sincronización del estado de la UI, y su robusto sistema de reglas de seguridad para implementar la lógica de roles.  
  * **Autenticación:** **Firebase Authentication**. Maneja la gestión de usuarios de forma segura, permitiendo una fácil integración con múltiples proveedores (Email, Google, etc.) en el futuro.  
* **Inteligencia Artificial:**  
  * **Proveedor:** **Google AI**.  
  * **API:** **Gemini API**. Se utiliza el modelo gemini-2.5-flash-preview-05-20 por su balance entre velocidad y capacidad para tareas de lenguaje natural y extracción de datos estructurados (JSON).

### **3\. Perfiles de Usuario y Gestión de Roles**

La plataforma define tres roles con permisos específicos.

* **Reclutador (Admin):**  
  * **Flujo Típico:** Inicia sesión y ve el dashboard global. Define o actualiza el Contexto Estratégico. Usa el Módulo de Sourcing para buscar nuevos talentos y añadirlos al Backlog. Crea un nuevo proceso para un Gerente de Área, define el plan de entrevistas inicial y asigna los entrevistadores. Supervisa el avance de todos los candidatos en el Kanban, se comunica con ellos y, finalmente, ejecuta la acción de "Enviar Oferta" basándose en el feedback de todo el equipo.  
* **Gerente de Área (Propietario del Proceso):**  
  * **Flujo Típico:** Inicia sesión y ve únicamente los procesos de sus vacantes. Puede crear una nueva posición para su equipo, definiendo el plan de entrevistas con sus colaboradores. Revisa los candidatos que el Reclutador ha pre-filtrado, participa en las entrevistas asignadas, carga su feedback detallado y colabora en la decisión final.  
* **Entrevistador (Participante):**  
  * **Flujo Típico:** Recibe una notificación (externa o en la app). Inicia sesión y ve una vista de "Tareas Pendientes" muy simple, que le muestra únicamente al candidato que debe evaluar. Accede al perfil, realiza la entrevista y completa un formulario conciso con su feedback y calificación. Una vez enviado, su tarea desaparece de la lista.

### **4\. Modelo de Datos (Firestore)**

La arquitectura de datos es relacional, distribuida en colecciones para garantizar la escalabilidad.

* **Colección de Usuarios:** /artifacts/{appId}/users  
  * **Estructura del Documento user:**  
    {   
      "uid": "firebase\_auth\_uid",   
      "name": "Juan Pérez",   
      "email": "juan.perez@empresa.com",   
      "role": "Gerente"   
    }

* **Colección de Candidatos (Backlog):** /artifacts/{appId}/candidates  
  * **Estructura del Documento candidate:**  
    {  
      "name": "Ana Torres", "title": "Especialista en Soporte Técnico",   
      "resume": "5 años de experiencia...",  
      "contactInfo": { "email": "ana.t@email.com", "phone": "+123456789" },  
      "status": "Available",  
      "currentProcessId": null,  
      "history": \[  
        {  
          "processId": "proc\_abc123",  
          "processTitle": "Agente de Servicio al Cliente",  
          "date": "Timestamp",  
          "outcome": "Finalista no seleccionado",  
          "notes": "Excelente perfil, pero buscábamos más experiencia en ventas.",  
          "aiAnalysisSnapshot": { /\* ... copia del análisis de IA de ese momento ... \*/ }  
        }  
      \]  
    }

* **Colección de Procesos:** /artifacts/{appId}/processes  
  * **Estructura del Documento process:**  
    {  
      "title": "Ingeniero de Software Senior", "stage": 4,   
      "jobDescription": "Buscamos un ingeniero para...",  
      "ownerId": "uid\_gerente\_area",   
      "collaboratorIds": \["uid\_reclutador\_1"\],   
      "hiredCandidateId": null,  
      "createdAt": "Timestamp",  
      "interviewPlan": \[   
        { "stepId": "s1", "stepName": "Filtro RRHH", "assignedUserId": "uid\_reclutador\_1" },  
        { "stepId": "s2", "stepName": "Prueba Técnica", "assignedUserId": "uid\_lider\_tecnico" }  
      \],  
      "candidatesInProcess": {   
        "cand\_xyz789": { "currentStepId": "s2", "status": "Active" }  
      },  
      "interviewFeedback": {  
        "cand\_xyz789": {  
          "s1": {   
            "interviewerId": "uid\_reclutador\_1",  
            "submittedAt": "Timestamp",  
            "rating": 5,  
            "feedback": "Gran comunicación y se alinea con la cultura."  
          }  
        }  
      }  
    }

* **Colección de Configuración:** /artifacts/{appId}/configuration  
  * **Estructura del Documento strategicContext:**  
    {   
      "strategicVision": "Ser líderes en...",   
      "companyMission": "Nuestra misión es...",  
      "coreValues": \["Innovación", "Foco en el Cliente"\],   
      "communicationTone": "Cercano y profesional"  
    }

### **5\. Desglose de Módulos y Funcionalidades**

#### **Módulo de Configuración: Contexto Estratégico**

* **Acceso:** Reclutador.  
* **Funcionalidad:** Un formulario para definir la visión, misión, valores y tono de la empresa. Esta información se inyecta en todas las llamadas a la IA para asegurar la alineación con la marca.

#### **Módulo de Sourcing (Búsqueda Proactiva)**

* **Acceso:** Reclutador.  
* **Funcionalidad:** Permite buscar talento activamente. El Reclutador describe un perfil ideal en lenguaje natural y la IA genera una lista de prospectos. Los perfiles interesantes se pueden añadir al Backlog con un solo clic.

#### **Módulo de Expedientes (Backlog de Talento)**

* **Acceso:** Reclutador.  
* **Funcionalidad:** Repositorio central de candidatos. Permite:  
  1. **Añadir perfiles manualmente** a través de un formulario.  
  2. **Añadir perfiles con IA**, subiendo un CV para que Gemini extraiga y rellene los datos.  
  3. Ver el **historial completo** de interacciones de cualquier candidato.  
  4. **Asignar candidatos** a procesos de selección activos.

#### **Módulo de Creación de Procesos**

* **Acceso:** Reclutador, Gerente de Área.  
* **Funcionalidad:**  
  1. **Asistente de IA:** Genera una descripción de puesto profesional a partir de datos simples.  
  2. **Plan de Entrevistas:** Permite crear un flujo de entrevistas personalizado, definiendo cada etapa y asignándola a un usuario (Entrevistador) de la plataforma.

#### **Módulo de Gestión de Entrevistas (Kanban)**

* **Acceso:** Reclutador, Gerente de Área, Entrevistador (vista restringida).  
* **Funcionalidad:**  
  * **Tablero Kanban:** Visualiza el flujo de entrevistas definido para el puesto.  
  * **Gestión Colaborativa:** El Reclutador/Gerente mueve a los candidatos entre etapas.  
  * **Feedback Centralizado:** Cuando un candidato es movido a una etapa, el Entrevistador asignado es notificado y puede acceder a un formulario para cargar su informe, que queda permanentemente registrado.

#### **Módulo de Comunicación**

* **Acceso:** Reclutador, Gerente de Área.  
* **Funcionalidad:** Al cambiar el estado de un candidato, la IA genera un borrador de correo (invitación, rechazo, etc.) alineado con el tono de la empresa. El usuario puede editarlo y lo envía manualmente desde su cliente de correo, manteniendo el control total.

#### **Módulo de Análisis de Candidatos**

* **Acceso:** Reclutador, Gerente de Área.  
* **Funcionalidad:** Dentro de un proceso, la IA puede analizar un perfil contra la descripción del puesto y generar un informe estructurado con:  
  * Puntaje de compatibilidad.  
  * Análisis de habilidades técnicas y blandas.  
  * Evaluación de ajuste cultural (basado en el Contexto Estratégico).  
  * Preguntas de entrevista personalizadas.

### **6\. Roadmap y Futuras Mejoras**

#### **A Implementar**

* **Dashboard de Analíticas:**  
  * **Concepto:** Una sección visual con métricas clave (Tiempo de Contratación, análisis del embudo, etc.).  
  * **Interacción IA:** Permitir preguntas en lenguaje natural para que Gemini interprete los datos y ofrezca conclusiones estratégicas.

#### **Posibilidades Futuras**

* **Integración con Calendarios:** Para agendar entrevistas directamente.  
* **Sistema de Notificaciones:** Alertas en tiempo real dentro de la app.  
* **Pruebas Psicométricas/Técnicas:** Integración con plataformas de evaluación de terceros.

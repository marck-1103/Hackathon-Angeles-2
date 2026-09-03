# Mente Sana

Proyecto desarrollado para la actividad de control de versiones con Git y GitHub.
**Mente Sana** es un sitio web de bienestar emocional que ofrece información confiable, actividades guiadas y un espacio personal para que cada usuario observe cómo se siente, gane hábitos saludables y se conecte con una comunidad de apoyo.

> "Una mente sana es el primer paso hacia una vida plena."

## Características

- **Inicio** — Presentación del propósito del sitio y acceso rápido a los recursos.
- **Sobre la salud mental** — Contenido educativo sobre bienestar emocional.
- **Recursos** — Artículos filtrables por categoría (Drogas, Depresión, Vínculos, etc.), con sistema de comentarios.
- **Actividades diarias** — Ejercicios breves (respiración, meditación, gratitud...) que rotan cada día y otorgan monedas al completarse.
- **Mi espacio (perfil)** — Panel privado con:
  - Mascota virtual **Mimo**, que se cuida con las monedas ganadas.
  - Gráfico de progreso semanal de actividades completadas.
  - Contacto de emergencia configurable.
  - Muro comunitario para publicar mensajes.
- **Asistente conversacional (Mimo Bot)** — Chatbot de acompañamiento con respuestas guiadas según la intención del mensaje.
- **Autenticación local** — Registro e inicio de sesión simulados, sin necesidad de servidor.

## Tecnologías

| Tecnología           | Uso                                                                                                                                                                            |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| HTML5                | Estructura y contenido semántico                                                                                                                                               |
| CSS3                 | Estilos, diseño responsivo y animaciones                                                                                                                                       |
| JavaScript (Vanilla) | Lógica de la aplicación, ruteo por hash y estado                                                                                                                               |
| `localStorage`       | Persistencia del estado del usuario, progreso y chat (capa de datos en `storage.js`, pensada para poder reemplazarse por una base de datos real sin tocar el resto del código) |
| Google Fonts         | Tipografías Poppins e Inter                                                                                                                                                    |

## Estructura del proyecto

entre la estructura del proyecto tenemos:
mente-sana/
├── index.html # Estructura principal y todos los módulos (SPA por hash routing)
├── style.css # Estilos generales
├── script.js # Lógica: estado, rutas, artículos, actividades, perfil y chatbot
└── imagenes/
├── Logo mente sana.jpeg
├── Mimo_2D_cabeza.svg
├── Mimo_2D_cuerpo_completo.svg
├── habitos-sanos.svg
├── salud_emocional.svg
├── salud_mental.svg
└── vinculos.svg

## Próximos pasos a implementar

- Se pretende migrar la capa de -localStorage- a un backend/base de datos real.
- Añadir autenticación segura (actualmente es simulada en el cliente).
- Moderación de contenido en comentarios y muro comunitario.
- Pruebas automatizadas para la lógica de actividades y progreso.
- Integracion con la api de open ai para atencion personalizada

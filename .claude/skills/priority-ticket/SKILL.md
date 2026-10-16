---
name: priority-ticket
description: Trae el ticket de mayor prioridad asignado al usuario logeado en Jira (vía
MCP) y arranca el trabajo sobre él. Usar al empezar una tarea nueva.
---
# Priority ticket
1. Consulta Jira vía MCP: busca los tickets asignados al usuario actual **en estado "To Do"**, ordénalos por prioridad y toma el de mayor prioridad. No consideres tickets ya
en "In Progress" o "Done" — evita re-tomar uno que ya está en marcha o cerrado.
2. Resume sus criterios de aceptación.
3. Entra en plan mode y propone cómo implementarlo (sigue las convenciones de 
AGENTS.md/CLAUDE.md si existen).
4. En cuanto el usuario apruebe el plan: mueve el ticket a "In Progress".
5. Al terminar (con el PR ya creado siguiendo las reglas de CLAUDE.md): mueve el ticket
a "Done" y deja un comentario en el ticket con el enlace al PR.
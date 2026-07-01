---
name: grilling-me
description: Interviews the user relentlessly about a plan or design until reaching shared understanding, resolving each branch of the decision tree one question at a time. Use when the user wants to stress-test a plan, get grilled on their design, or mentions "grill me". Accepts optional flag --suggestions (-s) to offer a recommended answer alongside each question.
---

Interroga sin descanso sobre todos los aspectos de este plan hasta que lleguemos a un entendimiento común. Recorre cada rama del árbol de diseño, resolviendo una a una las dependencias entre las decisiones.

**Flag `--suggestions` / `-s`:** Si está presente en los argumentos, añade tu respuesta recomendada después de cada pregunta. Si no está presente, haz solo la pregunta sin ofrecer sugerencia.

Haz las preguntas de una en una.

Si una pregunta puede responderse explorando el código, explora el código en lugar de preguntar.

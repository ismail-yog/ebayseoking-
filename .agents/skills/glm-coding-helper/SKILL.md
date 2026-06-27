---
name: glm-coding-helper
description: Consult NVIDIA's ChatGLM-5.1 model for advanced code generation, algorithm optimization, and debugging help.
---

# GLM-5.1 Coding Helper

You can use the local GLM helper script to consult NVIDIA's hosted `z-ai/glm-5.1` NIM model. This is particularly useful when you need:
- Extreme reasoning / long-horizon coding tasks.
- Specialized algorithm complexity analysis.
- Drop-in architectural advice.

## Execution

Ensure `NVIDIA_API_KEY` is set in your environment (e.g. in `.env.local`). Run the script:

```bash
node .agents/skills/glm-coding-helper/scripts/ask-glm.js "Write a highly optimized quicksort in TypeScript"
```

## Prompt Guidelines
When consulting GLM-5.1, ask it to output clear code blocks and explanations.

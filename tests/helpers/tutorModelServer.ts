// Test-only OpenAI-compatible HTTP fixture. Production never imports this file.
import { createServer } from "node:http";
const server = createServer(async (req, res) => {
  if (req.url === "/health") {
    res.end("ready");
    return;
  }
  let body = "";
  for await (const chunk of req) body += chunk;
  if (body.length > 1000000) {
    res.writeHead(413);
    res.end();
    return;
  }
  const input = JSON.parse(body),
    { context, message } = JSON.parse(input.input[1].content),
    question = message.toLowerCase();
  if (question.includes("slow"))
    await new Promise((resolve) => setTimeout(resolve, 2200));
  if (question.includes("failed request")) {
    res.writeHead(503, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        error: { message: "Test provider unavailable", type: "server_error" },
      }),
    );
    return;
  }
  const reply = {
    version: 1,
    explanation:
      "The explanation uses the current selected element, model assumptions, and locally computed outputs. Increasing a parameter changes the model only after you apply the proposal.",
    clarification: null,
    actions: [] as unknown[],
    animation: null,
    elements: [] as string[],
    sourceIds: [] as string[],
    assumptions: context.capabilities.assumptions.slice(0, 1),
    caveats: ["This is a simplified educational model."],
    suggestions: ["Why did that happen?", "What assumptions are we making?"],
  };
  const action = (key: string, value: number) => ({
    version: 1,
    type: "set_parameter",
    target: "scene",
    payload: { key, value },
  });
  if (question.includes("unsupported"))
    reply.actions = [action("inventedParameter", 100)];
  else if (
    !question.includes("why") &&
    !question.includes("assumptions") &&
    !question.includes("current") &&
    !question.includes("simply")
  ) {
    switch (context.scene?.type) {
      case "gradient-descent":
        reply.actions = [
          action("learningRate", 1.2),
          {
            version: 1,
            type: "set_step",
            target: "scene",
            payload: { step: 5 },
          },
        ];
        break;
      case "task-scheduler":
        reply.actions = [action("executors", 4)];
        break;
      case "supply-demand":
        reply.actions = [action("demandShift", 20)];
        break;
      case "dna-replication":
        reply.actions = [
          {
            version: 1,
            type: "set_step",
            target: "scene",
            payload: { step: 3 },
          },
          {
            version: 1,
            type: "highlight",
            target: "scene",
            payload: { ids: ["dna-leading", "dna-lagging"] },
          },
        ];
        reply.sourceIds = ["dna-mechanisms"];
        break;
      case "historical-timeline": {
        const target = context.navigation.find(
          (n: { type: string; id: string }) =>
            n.type === "historical-timeline" && n.id !== context.sceneId,
        );
        if (target) {
          reply.actions = [
            {
              version: 1,
              type: "navigate_scene",
              target: "lesson",
              payload: { sceneId: target.id },
            },
          ];
        } else {
          reply.actions = [
            {
              version: 1,
              type: "set_step",
              target: "scene",
              payload: { step: Math.max(0, context.capabilities.maxStep - 1) },
            },
          ];
        }
        reply.sourceIds = context.sources
          .slice(-2)
          .map((s: { id: string }) => s.id);
        break;
      }
    }
  }
  if (context.readOnly)
    reply.sourceIds = context.sources
      .slice(0, 2)
      .map((s: { id: string }) => s.id);
  res.setHeader("Content-Type", "application/json");
  res.end(
    JSON.stringify({
      id: "resp_test_tutor",
      object: "response",
      status: "completed",
      model: "test-tutor",
      usage: { input_tokens: 100, output_tokens: 80, total_tokens: 180 },
      output: [
        {
          id: "msg_test",
          type: "message",
          role: "assistant",
          status: "completed",
          content: [
            {
              type: "output_text",
              text: JSON.stringify(reply),
              annotations: [],
            },
          ],
        },
      ],
    }),
  );
});
server.listen(3199, "127.0.0.1");

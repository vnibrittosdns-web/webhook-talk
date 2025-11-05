import express from "express";
const app = express();

app.use(express.json());

app.post("/webhook/talk", (req, res) => {
  console.log("📩 Webhook recebido:", req.body);
  res.status(200).send("ok");
});

app.get("/", (req, res) => {
  res.send("🚀 Webhook DNS Consultoria ativo com sucesso!");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));

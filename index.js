import express from "express";
import axios from "axios";

const app = express();
app.use(express.json());

// Configurações do TomTicket
const TOMTICKET_URL = "https://seudominio.tomticket.com/api/v1/tickets";
const TOMTICKET_KEY = "SUA_API_KEY_AQUI";
const TOMTICKET_TOKEN = "SEU_TOKEN_AQUI";

// Armazena dados temporários de cada cliente
const clientes = {};

// Função para enviar mensagem (ainda simulada)
async function enviarMensagem(telefone, texto) {
  console.log(`📤 [Simulado] Mensagem enviada para ${telefone}: ${texto}`);
}

// Webhook do Umbler Talk
app.post("/webhook/talk", async (req, res) => {
  const { event, data } = req.body;
  if (event !== "message.received") return res.send("ok");

  const nome = data.contact?.name || "Cliente";
  const telefone = data.contact?.phone;
  const mensagem = (data.message?.text || "").trim();

  console.log(`💬 Mensagem recebida de ${nome} (${telefone}): ${mensagem}`);

  // Primeira interação
  if (!clientes[telefone]) {
    clientes[telefone] = { etapa: "inicio" };
    await enviarMensagem(
      telefone,
      `Olá! Sou o assistente virtual da DNS Consultoria 👋\n\nVou te auxiliar com sua solicitação para melhorar nossa comunicação com a equipe técnica.\n\nAntes de seguirmos, preciso de algumas informações:\n\n➡️ Seu nome:\n➡️ Sua Empresa:\n➡️ Seu e-mail corporativo:\n\nSe já tiver um número de chamado, pode informar agora.`
    );
    return res.send("ok");
  }

  // Interação em andamento
  const cliente = clientes[telefone];

  switch (cliente.etapa) {
    case "inicio":
      if (mensagem.match(/^\d+$/)) {
        await enviarMensagem(
          telefone,
          `Perfeito! Vamos verificar o chamado nº ${mensagem}. Aguarde um momento...`
        );
        cliente.numeroChamado = mensagem;
        cliente.etapa = "finalizado";
      } else {
        cliente.nome = mensagem;
        cliente.etapa = "empresa";
        await enviarMensagem(telefone, "Obrigado! Agora, informe o nome da sua empresa:");
      }
      break;

    case "empresa":
      cliente.empresa = mensagem;
      cliente.etapa = "email";
      await enviarMensagem(telefone, "Perfeito 👍 Agora, digite seu e-mail corporativo:");
      break;

    case "email":
      cliente.email = mensagem;
      cliente.etapa = "criando";
      await enviarMensagem(telefone, "Obrigado! Criando seu chamado técnico... 🔧");

      try {
        const chamado = {
          title: `Atendimento via WhatsApp - ${cliente.nome}`,
          requester_name: cliente.nome,
          requester_email: cliente.email,
          requester_phone: telefone,
          message: `Empresa: ${cliente.empresa}\nMensagem inicial: ${mensagem}`,
          department_id: 1,
          priority: 2,
        };

        const response = await axios.post(TOMTICKET_URL, chamado, {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${TOMTICKET_TOKEN}`,
            "x-api-key": TOMTICKET_KEY,
          },
        });

        await enviarMensagem(
          telefone,
          `✅ Chamado criado com sucesso!\nNúmero do chamado: ${response.data.ticket_number}\n\nUm técnico entrará em contato em breve.`
        );
        cliente.etapa = "finalizado";

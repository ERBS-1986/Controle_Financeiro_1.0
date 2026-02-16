
import { GoogleGenAI, Type } from "@google/genai";
import { Transaction, Language } from "../types";

// Always use the process.env.API_KEY directly in the constructor
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getFinancialAdvice = async (transactions: Transaction[], language: Language = 'pt-BR') => {
  if (transactions.length === 0) {
    return language === 'pt-BR' 
      ? "Adicione algumas transações para que eu possa analisar suas finanças!"
      : "Add some transactions so I can analyze your finances!";
  }

  const transactionSummary = transactions.map(t => ({
    tipo: t.type,
    valor: t.amount,
    categoria: t.category,
    descricao: t.description,
    frequencia: t.frequency,
    data: t.date
  }));

  const langText = language === 'pt-BR' ? 'Português do Brasil' : 'English (US)';

  const prompt = `
    Analise o seguinte histórico de transações financeiras e forneça:
    1. Um breve resumo do comportamento financeiro, destacando o impacto de gastos mensais fixos vs pontuais.
    2. Identifique possíveis desperdícios ou categorias com gastos elevados.
    3. Dê 3 dicas práticas e personalizadas para economizar ou investir melhor, considerando os compromissos recorrentes.
    4. Avalie a saúde financeira geral (Ótima, Boa, Alerta ou Crítica).

    Transações:
    ${JSON.stringify(transactionSummary, null, 2)}

    Responda em ${langText}, de forma amigável e profissional. Use Markdown para formatação.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        temperature: 0.7,
        topP: 0.8,
        topK: 40
      }
    });

    return response.text;
  } catch (error) {
    console.error("Error fetching financial advice:", error);
    return language === 'pt-BR'
      ? "Desculpe, não consegui analisar suas finanças no momento. Tente novamente mais tarde."
      : "Sorry, I couldn't analyze your finances at the moment. Please try again later.";
  }
};

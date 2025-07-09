import React, { useState } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from "recharts";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Textarea } from "./components/ui/textarea";
import { Card, CardContent } from "./components/ui/card";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28"];

const combinaisonMap = {
  1: "BBA", 2: "AAB", 3: "BAB", 4: "ABA", 5: "ABB",
  6: "BAA", 7: "BBA", 8: "AAB", 9: "BAB", 10: "ABA",
  11: "ABB", 12: "BAA", 13: "BBA", 14: "AAB", 15: "BAB",
  16: "ABA", 17: "ABB", 18: "BAA", 19: "BBA", 20: "AAB"
};

function getCorrectAnswer(combinaison) {
  const counts = {};
  for (let char of combinaison.toUpperCase()) {
    counts[char] = (counts[char] || 0) + 1;
  }
  const intrus = Object.keys(counts).find(k => counts[k] === 1);
  return ["X", "Y", "Z"][combinaison.toUpperCase().indexOf(intrus)];
}

export default function TriangleTestApp() {
  const [step, setStep] = useState(1);
  const [results, setResults] = useState([]);
  const [current, setCurrent] = useState(0);
  const [sampleInfo, setSampleInfo] = useState({ date: "", samples: "", essai: "", produitA: "", produitB: "" });
  const [input, setInput] = useState({ response: "", intensity: "", type: "", remarks: "" });
  const [analysis, setAnalysis] = useState(null);

  const handleNext = () => {
    const degustateurId = current + 1;
    const combinaison = combinaisonMap[degustateurId];
    const correctAnswer = getCorrectAnswer(combinaison);
    const correct = input.response.toUpperCase() === correctAnswer;
    const entry = { ...input, combinaison, correct };
    const newResults = [...results, entry];
    setResults(newResults);
    setInput({ response: "", intensity: "", type: "", remarks: "" });
    if (current + 1 < 20) {
      setCurrent(current + 1);
    } else {
      setStep(3);
      analyze(newResults);
    }
  };

  const analyze = (data) => {
    const correctCount = data.filter(d => d.correct).length;
    const requiredCorrect = Math.ceil(20 * 0.55);
    const significance = correctCount >= requiredCorrect;
    const averageIntensity = (data.reduce((sum, d) => sum + Number(d.intensity), 0) / 20).toFixed(2);
    const typeMap = { "goût": "goût", "gout": "goût", "texture": "texture", "les deux": "les deux" };
    const counts = { "goût": 0, "texture": 0, "les deux": 0 };
    data.forEach(d => {
      const normalized = typeMap[d.type.toLowerCase().trim()];
      if (normalized) counts[normalized]++;
    });
    const typeData = Object.keys(counts).map(k => ({ name: k, value: counts[k] })).filter(e => e.value > 0);
    setAnalysis({ correctCount, requiredCorrect, significance, averageIntensity, typeData, data });
  };

  const exportPDF = async () => {
    const pdf = new jsPDF();

    const logo = new Image();
    logo.src = "/logo-hafner.png";
    await new Promise(res => logo.onload = res);
    pdf.addImage(logo, "PNG", 10, 10, 30, 30);

    pdf.setFontSize(18);
    pdf.text("Rapport de test organoleptique triangulaire", 105, 20, { align: "center" });
    pdf.setFontSize(12);
    let y = 50;
    pdf.text(`Nom de l’essai : ${sampleInfo.essai}`, 14, y); y += 8;
    pdf.text(`Date du test : ${sampleInfo.date}`, 14, y); y += 8;
    pdf.text(`Échantillons testés : ${sampleInfo.samples}`, 14, y); y += 8;
    pdf.text(`Produit A : ${sampleInfo.produitA}`, 14, y); y += 8;
    pdf.text(`Produit B : ${sampleInfo.produitB}`, 14, y); y += 8;
    pdf.text(`Nombre de dégustateurs : 20`, 14, y); y += 12;
    pdf.text(`Nombre de réponses correctes : ${analysis.correctCount}`, 14, y); y += 8;
    pdf.text(`Seuil requis (55%) : ${analysis.requiredCorrect}`, 14, y); y += 8;
    pdf.text(`Test significatif ? : ${analysis.significance ? "✅ Oui" : "❌ Non"}`, 14, y); y += 8;
    pdf.text(`Intensité moyenne perçue : ${analysis.averageIntensity}/5`, 14, y); y += 12;

    const conclusion = analysis.significance
      ? `✅ Une différence significative a été perçue entre ${sampleInfo.produitA} et ${sampleInfo.produitB}.`
      : `❌ Aucune différence significative n'a été perçue entre ${sampleInfo.produitA} et ${sampleInfo.produitB}.`;
    pdf.setFontSize(11);
    pdf.text(conclusion, 14, y); y += 20;

    const pieElement = document.getElementById("pie-chart-capture");
    if (pieElement) {
      const canvas = await html2canvas(pieElement);
      const imgData = canvas.toDataURL("image/png");
      pdf.addImage(imgData, "PNG", 40, y, 130, 90);
    }

    pdf.save("rapport-degustation.pdf");
  };

  return null;
}

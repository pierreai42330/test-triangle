
// 1. Fichier complet App.jsx (ou App.js si tu ne veux pas de TypeScript)
// À placer dans /src/App.jsx
import "./App.css";
import React, { useState } from "react";
import jsPDF from "jspdf";
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from "recharts";

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

export default function App() {
  const [step, setStep] = useState(1);
  const [numTesters, setNumTesters] = useState(20);
  const [results, setResults] = useState([]);
  const [current, setCurrent] = useState(0);
  const [sampleInfo, setSampleInfo] = useState({ date: "", samples: "", essai: "", produitA: "", produitB: "" });
  const [input, setInput] = useState({ response: "", intensity: "", type: "", remarks: "" });
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState("");

  const handleNext = () => {
    const degustateurId = current + 1;
    const combinaison = combinaisonMap[degustateurId];
    if (!combinaison) {
      setError("Erreur : aucune combinaison définie pour ce dégustateur (limite de 20).");
      return;
    }
    setError("");
    const correctAnswer = getCorrectAnswer(combinaison);
    const correct = input.response.toUpperCase() === correctAnswer;
    const entry = { ...input, combinaison, correct };
    const updatedResults = [...results, entry];
    setResults(updatedResults);
    setInput({ response: "", intensity: "", type: "", remarks: "" });
    if (degustateurId < numTesters) {
      setCurrent(current + 1);
    } else {
      setStep(3);
      analyze(updatedResults);
    }
  };

  const analyze = (data) => {
    const correctCount = data.filter(d => d.correct).length;
    const requiredCorrect = Math.ceil(numTesters * 0.55);
    const significance = correctCount >= requiredCorrect;
    const averageIntensity = (data.reduce((sum, d) => sum + Number(d.intensity), 0) / numTesters).toFixed(2);
    const typeMap = { "goût": "goût", "gout": "goût", "texture": "texture", "les deux": "les deux" };
    const counts = { "goût": 0, "texture": 0, "les deux": 0 };
    data.forEach(d => {
      const norm = typeMap[d.type.toLowerCase().trim()];
      if (norm) counts[norm]++;
    });
    const typeData = Object.keys(counts).map(k => ({ name: k, value: counts[k] })).filter(e => e.value > 0);
    setAnalysis({ correctCount, requiredCorrect, significance, averageIntensity, typeData, data });
  };

  const exportPDF = () => {
  const pdf = new jsPDF();

  // 🟦 Logo Hafner (assurez-vous que le fichier est dans /public)
  const logo = new Image();
  logo.src = `${window.location.origin}/logo-hafner.png`;
  logo.onload = () => {
    pdf.addImage(logo, "PNG", 10, 10, 30, 15); // x, y, width, height

    // Titre stylisé
    pdf.setFontSize(16);
    pdf.setFont("helvetica", "bold");
    pdf.text("Rapport de test triangulaire organoleptique", 105, 25, { align: "center" });

    // Phrase d'intro norme
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    pdf.text(
      "Test réalisé conformément à la norme ISO 4120:2004 (Analyse sensorielle - Méthode triangulaire).",
      105,
      32,
      { align: "center" }
    );

    // Infos générales
    pdf.setFontSize(11);
    let y = 45;
    pdf.text(`Essai : ${sampleInfo.essai}`, 10, y); y += 8;
    pdf.text(`Date : ${sampleInfo.date}`, 10, y); y += 8;
    pdf.text(`Échantillons testés : ${sampleInfo.samples}`, 10, y); y += 8;
    pdf.text(`Produit A : ${sampleInfo.produitA}`, 10, y); y += 8;
    pdf.text(`Produit B : ${sampleInfo.produitB}`, 10, y); y += 12;

    // Résultats analytiques
    pdf.text(`Nombre de dégustateurs : ${numTesters}`, 10, y); y += 8;
    pdf.text(`Réponses correctes : ${analysis?.correctCount}`, 10, y); y += 8;
    pdf.text(`Seuil requis : ${analysis?.requiredCorrect}`, 10, y); y += 8;
    pdf.text(`Résultat : ${analysis?.significance ? "✅ Test significatif" : "❌ Non significatif"}`, 10, y); y += 8;
    pdf.text(`Intensité moyenne perçue : ${analysis?.averageIntensity}/5`, 10, y); y += 12;

    // Répartition Goût / Texture
    pdf.text("Répartition des perceptions :", 10, y); y += 8;
    analysis?.typeData.forEach(t => {
      pdf.text(`• ${t.name} : ${t.value}`, 14, y);
      y += 6;
    });

    // Conclusion
    y += 10;
    const conclusion = analysis?.significance
      ? `Conclusion : Une différence significative a été perçue entre ${sampleInfo.produitA} et ${sampleInfo.produitB}.`
      : `Conclusion : Aucune différence significative n'a été perçue entre ${sampleInfo.produitA} et ${sampleInfo.produitB}.`;
    pdf.setFont("helvetica", "bold");
    pdf.text(conclusion, 10, y);

    // Enregistrer le PDF
    pdf.save("rapport-degustation.pdf");
  };
};


  if (step === 1) {
    return (
      <div className="p-4 max-w-xl mx-auto">
        <h1 className="text-xl font-bold mb-2">Informations sur le test</h1>
        <label>Nom de l'essai</label>
        <input className="border p-2 w-full mb-2" value={sampleInfo.essai} onChange={e => setSampleInfo({ ...sampleInfo, essai: e.target.value })} />
        <label>Date du test</label>
        <input type="date" className="border p-2 w-full mb-2" value={sampleInfo.date} onChange={e => setSampleInfo({ ...sampleInfo, date: e.target.value })} />
        <label>Échantillons testés</label>
        <input className="border p-2 w-full mb-2" value={sampleInfo.samples} onChange={e => setSampleInfo({ ...sampleInfo, samples: e.target.value })} />
        <label>Produit A</label>
        <input className="border p-2 w-full mb-2" value={sampleInfo.produitA} onChange={e => setSampleInfo({ ...sampleInfo, produitA: e.target.value })} />
        <label>Produit B</label>
        <input className="border p-2 w-full mb-2" value={sampleInfo.produitB} onChange={e => setSampleInfo({ ...sampleInfo, produitB: e.target.value })} />
        <label>Nombre de dégustateurs (max 20)</label>
        <input type="number" className="border p-2 w-full mb-2" value={numTesters} onChange={e => setNumTesters(Math.min(20, Math.max(1, parseInt(e.target.value) || 1)))} />
        <button className="bg-blue-500 text-white px-4 py-2 mt-4" onClick={() => setStep(2)}>Commencer la saisie des résultats</button>
      </div>
    );
  }

  if (step === 2) {
    const degustateurId = current + 1;
    const combinaison = combinaisonMap[degustateurId];
    return (
      <div className="p-4 max-w-xl mx-auto">
        <h2 className="text-lg font-bold mb-2">Dégustateur n°{degustateurId}</h2>
        <p>Combinaison présentée : <strong>{combinaison}</strong></p>
        {error && <p className="text-red-600">{error}</p>}
        <label>Échantillon perçu comme différent (X, Y ou Z)</label>
        <input className="border p-2 w-full mb-2" value={input.response} onChange={e => setInput({ ...input, response: e.target.value })} />
        <label>Intensité de la différence (sur 5)</label>
        <input className="border p-2 w-full mb-2" value={input.intensity} onChange={e => setInput({ ...input, intensity: e.target.value })} />
        <label>Type de différence (goût, texture, les deux)</label>
        <input className="border p-2 w-full mb-2" value={input.type} onChange={e => setInput({ ...input, type: e.target.value })} />
        <label>Remarques</label>
        <textarea className="border p-2 w-full mb-2" value={input.remarks} onChange={e => setInput({ ...input, remarks: e.target.value })} />
        <div className="flex justify-between mt-4">
  <button
    className="bg-gray-400 text-white px-4 py-2"
    disabled={current === 0}
    onClick={() => {
      // On revient au dégustateur précédent
      const newResults = [...results];
      newResults.pop(); // On retire la dernière saisie
      setResults(newResults);
      setCurrent(current - 1);
    }}
  >
    ⬅ Précédent
  </button>

  <button
    className="bg-blue-500 text-white px-4 py-2"
    onClick={handleNext}
  >
    Suivant ➡
  </button>
</div>
    );
  }

  if (step === 3 && analysis) {
    return (
      <div className="p-4 max-w-3xl mx-auto">
        <h2 className="text-xl font-bold mb-4">Résultats</h2>
        <p>Réponses correctes : {analysis.correctCount}</p>
        <p>Seuil requis : {analysis.requiredCorrect}</p>
        <p>Résultat : {analysis.significance ? "Test significatif" : "Non significatif"}</p>
        <p>Intensité moyenne : {analysis.averageIntensity}/5</p>

        <div className="my-6">
          <h3 className="text-lg font-semibold">Répartition des perceptions</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={analysis.typeData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                {analysis.typeData.map((_, i) => (
                  <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4">
          <h3 className="text-lg font-semibold">Remarques des dégustateurs</h3>
          <ul className="list-disc ml-6">
            {analysis.data.map((d, i) => (
              <li key={i}><strong>Dégustateur {i + 1} :</strong> {d.remarks}</li>
            ))}
          </ul>
        </div>

        <button className="bg-green-600 text-white px-4 py-2 mt-6" onClick={exportPDF}>Exporter le rapport PDF</button>
      </div>
    );
  }

  return null;
}

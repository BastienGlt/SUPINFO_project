const oeuvreService = require('../services/oeuvre.service');

exports.getAllNotesMoyennes = async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;
    const offset = req.query.offset ? parseInt(req.query.offset) : 0;
    const result = await oeuvreService.getAllNotesMoyennes({ limit, offset });
    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Impossible de récupérer les notes moyennes" });
  }
};

exports.getNoteMoyenneByApiRef = async (req, res) => {
  try {
    const apiRefId = req.params.id;
    const result = await oeuvreService.getNoteMoyenneByApiRef(apiRefId);
    if (!result) {
      return res.status(404).json({ error: "Oeuvre introuvable ou aucune note" });
    }
    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Impossible de récupérer la note moyenne" });
  }
};

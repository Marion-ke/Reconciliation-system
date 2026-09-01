import express from "express";

const app = express();

app.use(express.json());

app.post("/webhook", (req, res) => {
  console.log("WEBHOOK RECEIVED:");
  console.log(JSON.stringify(req.body, null, 2));

  res.status(200).json({
    status: "received"
  });
});

app.listen(4000, () => {
  console.log("Test webhook receiver listening on port 4000");
});

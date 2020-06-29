const express = require("express");
const app = express();
const morgan = require("morgan");
const helmet = require("helmet");
const cors = require("cors");

app.use(helmet());
app.use(morgan("tiny"));
app.use(cors());
app.use(express.json());
app.use(express.static("./public"));

// app.get("/:id", (req, res) => {
//     // TODO: redirect to url
// });

// app.post("/url", (req, res) => {
//     // TODO: create a short url
// });

const port = process.env.PORT || 1337;
app.listen(port, () => {
    console.log(`Listening on http://localhost:${port} 🧑‍💻`);
});

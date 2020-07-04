const express = require("express");
const app = express();
const morgan = require("morgan");
const helmet = require("helmet");
const cors = require("cors");
const yup = require("yup");
const monk = require("monk");
const { nanoid } = require("nanoid");

// Sets up for .env file
require("dotenv").config();

// Creates db connection
const db = monk(process.env.MONGODB_URI);
const urls = db.get("urls");
urls.createIndex("slug", { unique: true });

app.use(helmet());
app.use(morgan("tiny"));
app.use(cors());
app.use(express.json());
app.use(express.static("./public"));

// Creates a schema for the mongodb.
const schema = yup.object().shape({
	slug: yup.string().matches(/[\w\-]/i), // string, not empty (but can be null), a-z0-9 insensitive
	url: yup.string().trim().url().required(), // required, string, url
});

// Create url shortcut
app.get("/url", async (req, res, next) => {
	let { url, slug } = req.query; // Gets slug and url from req.query

	try {
		if (!slug || slug == "") {
			// if slug is not sent in request, its created by nanoid
			slug = nanoid(5);
		} else {
			const existing = await urls.findOne({ slug });
			if (existing) {
				throw new Error("Slug in use. 🍔");
			}
		}
		slug = slug.toLowerCase(); // all to lowercase

		const newUrl = {
			url,
			slug,
		};
		const valid = await schema.validate({ slug, url }, (err) => {
			if (err) throw new Error(err.name);
		});

		const created = await urls.insert(newUrl);

		if (created && valid) {
			res.redirect(`/?success=${slug}`);
		} else {
			throw new Error("Something went wrong");
		}
	} catch (error) {
		next(error);
	}
});

app.get("/:id", async (req, res) => {
	const { id: slug } = req.params;
	try {
		const url = await urls.findOne({ slug });
		if (url) {
			res.redirect(url.url);
		} else {
			res.redirect(`/?error=${slug} not found`);
		}
	} catch (error) {
		res.redirect("/?error=link not found");
	}
});

// Express error handeler
app.use((error, req, res, next) => {
	// Sends errors status code to user
	if (error.status) {
		res.status(error.status);
	} else {
		res.status(500);
	}
	// Response is error msg and stack if NODE_ENV is in production
	res.redirect(`/?error=${error.message}`);
	res.json({
		messsage: error.message,
		stack: process.env.NODE_ENV === "production" ? "🥞" : error.stack,
	});
});

const port = process.env.PORT || 1337;
app.listen(port, () => {
	console.log(`Listening on http://localhost:${port} 🧑‍💻`);
});

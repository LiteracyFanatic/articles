#!/bin/node
import fs from "fs";

const templateFile = process.argv[2];
const htmlFile = process.argv[3];

const data = fs.readFileSync(htmlFile, "utf-8");
const template = fs.readFileSync(templateFile).toString();

// Get a list of unique characters
const chars = Array.from(new Set(data.split(""))).sort();

// Escape for CSS
const escapedChars = chars.join("").replace("\"", "%22").replace("\n", "");

const css = template.replace("ALL_CHARACTERS", escapedChars);
console.log(css);

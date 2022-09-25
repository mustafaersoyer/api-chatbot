"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const express = require("express");
//import { todo } from "../controllers";
const controllers_1 = require("../controllers");
const router = express.Router();
exports.router = router;
/*
router.post("/todo", todo.createTodo);
router.get("/todo", todo.getTodos);
router.get("/todo/:id", todo.getTodoById);
router.put("/todo/:id", todo.updateTodo);
router.delete("/todo/:id", todo.deleteTodo);*/
router.post("/create-sheet", controllers_1.createSheet);
router.post("/save-sheet-to-db", controllers_1.saveSheetToDb);

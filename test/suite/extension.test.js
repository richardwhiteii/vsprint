"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// test/suite/extension.test.ts
var assert = __toESM(require("assert"));
var vscode = __toESM(require("vscode"));
suite("Extension Test Suite", () => {
  vscode.window.showInformationMessage("Start all tests.");
  test("Extension should be present", () => {
    assert.ok(vscode.extensions.getExtension("richardwhiteii.vsprint"));
  });
  test("Export HTML command should be registered", async () => {
    const commands2 = await vscode.commands.getCommands();
    assert.ok(commands2.includes("vsprint.exportHtml"), "exportHtml command not registered");
  });
  test("Print File command should be registered", async () => {
    const commands2 = await vscode.commands.getCommands();
    assert.ok(commands2.includes("vsprint.printFile"), "printFile command not registered");
  });
  test("Print Selection command should be registered", async () => {
    const commands2 = await vscode.commands.getCommands();
    assert.ok(commands2.includes("vsprint.printSelection"), "printSelection command not registered");
  });
});

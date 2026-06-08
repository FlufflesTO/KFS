import { expect, test } from "@playwright/test";
import { csvObjects } from "../../../src/lib/server/csv";

test.describe("csvObjects", () => {
  test("parses valid CSV with expected headers", () => {
    const csvData = "name,age\nAlice,30\nBob,25";
    const result = csvObjects(csvData, ["name", "age"]);
    expect(result).toHaveLength(2);
    expect(result[0].rowNumber).toBe(2);
    expect(result[0].data).toEqual({ name: "Alice", age: "30" });
    expect(result[1].rowNumber).toBe(3);
    expect(result[1].data).toEqual({ name: "Bob", age: "25" });
  });

  test("throws error when CSV has less than two rows", () => {
    const csvData = "name,age";
    expect(() => csvObjects(csvData, ["name", "age"])).toThrow("CSV must include a header row and at least one data row.");

    // Test empty CSV handling internally returning < 2 rows
    expect(() => csvObjects("", ["name", "age"])).toThrow("CSV must include a header row and at least one data row.");
  });

  test("throws error when headers do not match expected headers", () => {
    const csvData = "name,gender\nAlice,Female";
    expect(() => csvObjects(csvData, ["name", "age"])).toThrow("CSV header must be exactly: name,age");

    // Header count mismatch
    const csvData2 = "name\nAlice";
    expect(() => csvObjects(csvData2, ["name", "age"])).toThrow("CSV header must be exactly: name,age");
  });

  test("handles empty or null string gracefully", () => {
    expect(() => csvObjects(null, ["name"])).toThrow("CSV must include a header row and at least one data row.");
    expect(() => csvObjects(undefined, ["name"])).toThrow("CSV must include a header row and at least one data row.");
  });

  test("handles extra spaces in headers and data", () => {
      const csvData = " name , age \n  Alice  ,  30  ";
      const result = csvObjects(csvData, ["name", "age"]);
      expect(result).toHaveLength(1);
      expect(result[0].data).toEqual({ name: "Alice", age: "30" });
  });

  test("handles missing optional values in row", () => {
      // Row is shorter than headers, missing columns should become empty string
      const csvData = "name,age\nAlice";
      const result = csvObjects(csvData, ["name", "age"]);
      expect(result).toHaveLength(1);
      expect(result[0].data).toEqual({ name: "Alice", age: "" });
  });

  test("handles quoted values", () => {
      const csvData = "name,desc\nAlice,\"hello, world\"";
      const result = csvObjects(csvData, ["name", "desc"]);
      expect(result).toHaveLength(1);
      expect(result[0].data).toEqual({ name: "Alice", desc: "hello, world" });
  });
});

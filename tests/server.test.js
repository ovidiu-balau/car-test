const request = require("supertest");
const server = require("../server");
const admin = require("firebase-admin");

describe("create cars endpoint", () => {
  it("should create a new car", async () => {
    const res = await request(server)
      .post("/api/new")
      .send({
        make: "Mercedes",
        model: "A110",
        colour: "Black",
        year: 2020
      });
    expect(res.statusCode).toEqual(200);
    expect(res.body.data).toHaveProperty("id");
  });

  it("shouldn't create a new car", async () => {
    const res = await request(server)
      .post("/api/new")
      .send({
        make: "Mercedes",
        model: "A110",
        year: 2020
      });
    expect(res.statusCode).toEqual(422);
  });
});

describe("get cars endpoint", () => {
  it("should get one car with soundAlike", async () => {
    const res = await request(server).get("/api/get/081cC2Y2S1gwPTEsEA0e");
    expect(res.body).toHaveProperty("soundAlike");
  });
  it("should not get a car", async () => {
    const res = await request(server).get("/api/get/081cC2Y2S1gwPTEsEA0ewqw");
    expect(res.body.message).toBe("No ID found");
  });
  it("should get all cars", async () => {
    const res = await request(server).get("/api/get/");
    expect(res.body.status).toBe("success");
  });
});

describe("modify car", () => {
  it("should modify a car", async () => {
    const res = await request(server)
      .post("/api/modify")
      .send({
        id: "0oijOa1K08w1Lera6Rw7",
        car: {
          make: "Mercedes",
          model: "A110",
          year: 2020
        }
      });
    expect(res.statusCode).toEqual(200);
  });

  it("should not modify a car because it has no id", async () => {
    const res = await request(server)
      .post("/api/modify")
      .send({
        car: {
          make: "Mercedes",
          model: "A110",
          year: 2020
        }
      });
    expect(res.statusCode).toEqual(422);
  });
  it("should not modify a car because it has no car", async () => {
    const res = await request(server)
      .post("/api/modify")
      .send({
        id: "0oijOa1K08w1Lera6Rw7"
      });
    expect(res.statusCode).toEqual(422);
  });
});

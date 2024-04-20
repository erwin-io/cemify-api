import { Test, TestingModule } from "@nestjs/testing";
import { BurialController } from "./burial.controller";

describe("BurialController", () => {
  let controller: BurialController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BurialController],
    }).compile();

    controller = module.get<BurialController>(BurialController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });
});

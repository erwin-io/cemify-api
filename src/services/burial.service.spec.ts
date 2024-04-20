import { Test, TestingModule } from "@nestjs/testing";
import { BurialService } from "./burial.service";

describe("BurialService", () => {
  let service: BurialService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BurialService],
    }).compile();

    service = module.get<BurialService>(BurialService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});

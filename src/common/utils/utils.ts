import { filter } from "rxjs";
import { type } from "os";
/* eslint-disable @typescript-eslint/no-var-requires */
import {
  getConnectionOptions,
  getConnection,
  Between,
  ILike,
  Raw,
  Not,
  ArrayOverlap,
  In,
  IsNull,
  LessThan,
} from "typeorm";
import * as bcrypt from "bcrypt";
import * as fs from "fs";
import * as path from "path";
import { Transform } from "class-transformer";
import moment from "moment";

export const toPromise = <T>(data: T): Promise<T> => {
  return new Promise<T>((resolve) => {
    resolve(data);
  });
};

export const getDbConnectionOptions = async (connectionName = "default") => {
  const options = await getConnectionOptions(
    process.env.NODE_ENV || "development"
  );
  return {
    ...options,
    name: connectionName,
  };
};

export const getDbConnection = async (connectionName = "default") => {
  return await getConnection(connectionName);
};

export const runDbMigrations = async (connectionName = "default") => {
  const conn = await getDbConnection(connectionName);
  await conn.runMigrations();
};

export const hash = async (value) => {
  return await bcrypt.hash(value, 10);
};

export const compare = async (newValue, hashedValue) => {
  return await bcrypt.compare(hashedValue, newValue);
};

export const getAge = async (birthDate: Date) => {
  const timeDiff = Math.abs(Date.now() - birthDate.getTime());
  return Math.floor(timeDiff / (1000 * 3600 * 24) / 365.25);
};

export const addHours = (numOfHours, date: Date) => {
  date.setTime(date.getTime() + numOfHours * 60 * 60 * 1000);
  return date;
};

export const round = (number) => {
  return Math.round((number + Number.EPSILON) * 100);
};

export function getEnvPath(dest: string): string {
  // const env: string | undefined = process.env.NODE_ENV;
  const env: string | undefined = process.env["NODE" + "_ENV"];
  const fallback: string = path.resolve(`${dest}/.env`);
  const filename: string = env ? `${env}.env` : "development.env";
  let filePath: string = path.resolve(`${dest}/${filename}`);

  if (!fs.existsSync(filePath)) {
    filePath = fallback;
  }

  return filePath;
}

export function ToBoolean(): (target: any, key: string) => void {
  return Transform((value: any) => value.obj[value.key]);
}

export function formatId(value: any, args?: any): unknown {
  let s = value + "";
  while (s.length < args) {
    s = "0" + s;
  }
  return s;
}

export const convertColumnNotationToObject = (notation, nestedValue) => {
  const object = {};
  let pointer = object;
  notation.split(".").map((key, index, arr) => {
    pointer = pointer[key] = index == arr.length - 1 ? nestedValue : {};
  });
  return object;
};

export const getFullName = (
  firstName: string,
  middleName = "",
  lastName: string
) => {
  if (middleName && middleName !== "") {
    return `${firstName} ${middleName} ${lastName}`;
  } else {
    return `${firstName} ${lastName}`;
  }
};

export const columnDefToTypeORMCondition = (columnDef) => {
  const conditionMapping = [];
  for (var col of columnDef) {
    if (col.type === "date") {
      if (
        moment(new Date(col.filter), "MMM DD, YYYY", true).isValid() ||
        moment(new Date(col.filter), "MMMM DD, YYYY", true).isValid() ||
        moment(new Date(col.filter), "YYYY-MM-DD", true).isValid()
      ) {
        conditionMapping.push(
          convertColumnNotationToObject(
            col.apiNotation,
            moment(new Date(col.filter), "YYYY-MM-DD")
          )
        );
      }
    } else if (col.type === "date-less-than") {
      if (
        moment(new Date(col.filter), "MMM DD, YYYY", true).isValid() ||
        moment(new Date(col.filter), "MMMM DD, YYYY", true).isValid() ||
        moment(new Date(col.filter), "YYYY-MM-DD", true).isValid()
      ) {
        conditionMapping.push(
          convertColumnNotationToObject(
            col.apiNotation,
            LessThan(moment(new Date(col.filter)).format("YYYY-MM-DD hh:mm:ss"))
          )
        );
      }
    } else if (col.type === "date-range") {
      const range: any[] =
        col.filter && col.filter.split(",").length > 0
          ? col.filter.split(",").filter((x) => x)
          : [];
      range[1] = range.length === 1 ? range[0] : range[1];
      if (
        moment(new Date(range[0]), "YYYY-MM-DD", true).isValid() &&
        moment(new Date(range[1]), "YYYY-MM-DD", true).isValid()
      ) {
        conditionMapping.push(
          convertColumnNotationToObject(
            col.apiNotation,
            Between(range[0], range[1])
          )
        );
      }
    } else if (col.type === "option-yes-no") {
      if (
        col.filter &&
        col.filter !== "" &&
        ["yes", "no"].some(
          (x) =>
            x.toString().toLowerCase() ===
            col.filter.toString().toLowerCase().trim()
        )
      ) {
        const value = col.filter.toString().toLowerCase().trim() === "yes";
        conditionMapping.push(
          convertColumnNotationToObject(col.apiNotation, value)
        );
      }
    } else if (col.type === "number-range") {
      const range = col.filter.split("-").map((x) => x?.trim());

      conditionMapping.push(
        convertColumnNotationToObject(
          col.apiNotation,
          Between(Number(range[0]), Number(range[1]))
        )
      );
    } else if (col.type === "number") {
      const value = !isNaN(Number(col.filter)) ? Number(col.filter) : 0;
      conditionMapping.push(
        convertColumnNotationToObject(col.apiNotation, value)
      );
    } else if (col.type === "precise") {
      conditionMapping.push(
        convertColumnNotationToObject(col.apiNotation, col.filter)
      );
    } else if (col.type === "not" || col.type === "except") {
      conditionMapping.push(
        convertColumnNotationToObject(col.apiNotation, ArrayOverlap(col.filter))
      );
    } else if (col.type === "in" || col.type === "includes") {
      conditionMapping.push(
        convertColumnNotationToObject(col.apiNotation, In(col.filter))
      );
    } else if (col.type === "null") {
      conditionMapping.push(
        convertColumnNotationToObject(col.apiNotation, IsNull())
      );
    } else {
      conditionMapping.push(
        convertColumnNotationToObject(col.apiNotation, ILike(`%${col.filter}%`))
      );
    }
  }
  const newArr = [];
  for (const item of conditionMapping) {
    const name = Object.keys(item)[0];
    if (newArr.some((x) => x[name])) {
      const index = newArr.findIndex((x) => x[name]);
      const res = Object.keys(newArr[index]).map((key) => newArr[index][key]);
      res.push(item[name]);
      newArr[index] = {
        [name]: Object.assign({}, ...res),
      };
      res.push(newArr[index]);
    } else {
      newArr.push(item);
    }
  }
  return Object.assign({}, ...newArr);
};

export const generateIndentityCode = (id) => {
  return String(id).padStart(6, "0");
};

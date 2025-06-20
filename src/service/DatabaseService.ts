import * as mysql from "mysql2/promise";

export default class DatabaseService {
  private connection: mysql.Connection;

  constructor() {
    mysql
      .createConnection({
        host: "localhost",
        user: "root",
        password: "rootpassword",
        database: "library",
      })
      .then((co) => {
        this.connection = co;
      });
  }

  isReady(): Promise<void> {
    return new Promise((resolve, _) => {
      const interval = setInterval(() => {
        if (this.connection) {
          clearInterval(interval);
          resolve();
        }
      }, 100);
    });
  }

  getConnection(): mysql.Connection {
    return this.connection;
  }
}

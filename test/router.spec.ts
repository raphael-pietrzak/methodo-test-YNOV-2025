import { describe, it } from "@jest/globals";
import * as express from "express";
import Router from "../src/router";

describe("router", () => {
  it('create book chapter', async () =>{
    // fixture
    const app = express();
    const router = new Router(app);

    router.init().setupRoutes();

    return new Promise((resolve, reject) => {
      app.listen(9001, async () => {
        console.log('Server is running on port 9001');
        // test
        const response = await fetch('http://localhost:9001/book/1/chapter', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            userId: 1,
          })
        });

        // assertion
        if(response.status !== 200) {
          return reject(new Error('Expected status code 200 and got ' + response.status));  
        }
        resolve(true);
      });
    });
  });
});

import { Injectable } from "@angular/core";

import { from, Observable } from "rxjs";
import { ReactorConfig } from "./chat-form";
import { API_KEY_CONF } from "../config";
import { HttpClient, HttpHeaders } from "@angular/common/http";


@Injectable({
  providedIn: "root",
})
export class DataService {

  generateContent(message: string, history: { role: string; content: string }[], config: any): Observable<any> {
    const api_url = 'https://api.arc.ai/v1/chat-completions';
    const headers = {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey,
    };

    const body = {
      model: config.model,
      messages: [
        {
          role: 'user',
          content: message,
        },
      ],
      top_p: 0.9,
      top_k: 40,
      temperature: 0.1,
      stream: true,
    };

    return new Observable(observer => {
      fetch(api_url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      })
        .then(response => {
          if (!response.body) {
            observer.error(new Error("Response body is null"));
            return;
          }

          const streamReader = response.body.getReader();
          const textDecoder = new TextDecoder();

          function readStream() {
            streamReader.read().then(({ done, value }) => {
              if (done) {
                observer.complete();
                return;
              }

              const decodedValue = textDecoder.decode(value, { stream: true });

              try {
                const lines = decodedValue.split('\n').map(line => line.trim()).filter(line => line);

                lines.forEach(line => {
                  try {
                    const parsedResult = JSON.parse(line);
                    observer.next(parsedResult);
                  } catch (e) {
                    observer.error(new Error("Failed to parse JSON"));
                  }
                });
              } catch (e) {
                observer.error(new Error("Failed to process stream"));
              }

              readStream();
            }).catch(error => {
              observer.error(error);
            });
          }

          readStream();
        })
        .catch(error => {
          observer.error(error);
        });
    });
  }


}

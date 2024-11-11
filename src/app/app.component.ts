import {
  Component,
  ElementRef,
  TemplateRef,
  ViewChild,
  inject,
} from "@angular/core";
import { RouterOutlet } from "@angular/router";
import { NgxLoadingModule, ngxLoadingAnimationTypes } from "ngx-loading";
import { trigger, style, transition, animate } from "@angular/animations";
import { DataService } from "./data.service";
import { CommonModule } from "@angular/common";
import { ConvertTextToHtmlPipe } from "./convert-text-to-html.pipe";
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from "@angular/forms";
import { ReactorConfig } from "./chat-form";
import { API_KEY_CONF } from "../config";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [
    RouterOutlet,
    CommonModule,
    NgxLoadingModule,
    ConvertTextToHtmlPipe,
    FormsModule,
    ReactiveFormsModule,
  ],
  templateUrl: "./app.component.html",
  styleUrl: "./app.component.scss",
  animations: [
    trigger("typeWritterEffect", [
      transition(":enter", [
        style({ opacity: 0 }),
        animate("2s", style({ opacity: 1 })),
      ]),
    ]),
  ],
})
export class AppComponent {
  @ViewChild("messagesContainer") private messagesContainer!: ElementRef;
  private dataService = inject(DataService);
  public messagesHistory: { role: string; content: string }[] = [];
  public userMessage!: string | null;
  public loading = false;
  public loadingTemplate!: TemplateRef<any>;
  public ngxLoadingAnimationTypes = ngxLoadingAnimationTypes;
  public loadingConfig = {
    animationType: ngxLoadingAnimationTypes.circleSwish,
    primaryColour: "#ffffff",
    secondaryColour: "#ccc",
    tertiaryColour: "#dd0031",
    backdropBorderRadius: "3px",
  };
  public gQuestions = [
    "What is the latest breaking news?",
    "What is Angular?",
    "What is new in Gemini Pro 1.5?",
  ];
  public bQuestions = [
    "Can you ıntroduce yourself?",
    "What kind of work do you do?",
    "What is your mail adres?",
  ];

  public characterSelection = [
    {
      id: 0,
      value: "Reactor",
    },

  ];

  temperatureOptions = [
    { value: 0.2, label: "Low Creativity" },
    { value: 0.5, label: "Moderate Creativity" },
    { value: 0.9, label: "High Creativity" },
  ];

  modelOptions = [
    { label: "Reactor MK1", value: "reactor-mk1", disabled: false },


  ];

  chatForm = new FormGroup({
    apiKey: new FormControl(API_KEY_CONF || ""),
    temperature: new FormControl(this.temperatureOptions[2].value),
    model: new FormControl(this.modelOptions[0].value),
    bot: new FormControl(this.characterSelection[0]),
  });

  sendMessage(message: string) {
    if (!message || this.loading) return;
    setTimeout(() => this.scrollToBottom(), 0);


    this.loading = true;
    this.messagesHistory.push(
      {
        role: 'user',
        content: message,
      },
      {
        role: 'assistant',
        content: '', // Placeholder for the incoming streamed content
      }
    );

    console.log(this.messagesHistory);
    const assistantMessageIndex = this.messagesHistory.length - 1;

    this.dataService.generateContent(message, this.messagesHistory, this.chatForm.value).subscribe({
      next: (res: any) => {

        this.userMessage = null;

        if (res.message && res.message.content) {
          this.messagesHistory[assistantMessageIndex].content += res.message.content; // Append streamed content
          setTimeout(() => this.scrollToBottom(), 0);
        }
        setTimeout(() => this.scrollToBottom(), 0);
      },
      error: (error) => {
        this.loading = false;
        console.error('Error generating content:', error);
        this.messagesHistory.push({
          role: 'model',
          content: 'Sorry, something went wrong. Please try again later.',
        });
        setTimeout(() => this.scrollToBottom(), 0);
      },
      complete: () => {

          this.loading = false;
          this.userMessage = null;
          console.log('Streaming complete');

      }
    });
  }

  scrollToBottom(): void {
    try {
      this.messagesContainer.nativeElement.scrollTop =
        this.messagesContainer.nativeElement.scrollHeight;
    } catch (err) {}
  }

  ngAfterViewInit() {
    this.scrollToBottom();
  }
}

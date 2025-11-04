import { Component, Input, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AiService, AIChatResponse } from '../../../core/services/ai.service';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: string[];
  suggested_actions?: string[];
}

@Component({
  selector: 'app-ai-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ai-chat.component.html',
  styleUrl: './ai-chat.component.css'
})
export class AiChatComponent implements OnInit {
  @Input() projectId!: string;
  
  private aiService = inject(AiService);

  // State
  isOpen = signal(false);
  isMinimized = signal(false);
  loading = signal(false);
  error = signal<string | null>(null);
  messages = signal<ChatMessage[]>([]);
  conversationId = signal<string | null>(null);
  
  // Form
  messageInput = signal('');

  ngOnInit(): void {
    // Mensaje de bienvenida
    this.messages.set([{
      role: 'assistant',
      content: '👋 ¡Hola! Soy tu asistente AI. Puedo ayudarte con información del proyecto, buscar issues, generar resúmenes y más. ¿En qué puedo ayudarte?',
      timestamp: new Date()
    }]);
  }

  toggleChat(): void {
    this.isOpen.update(v => !v);
    if (this.isOpen()) {
      this.isMinimized.set(false);
    }
  }

  toggleMinimize(): void {
    this.isMinimized.update(v => !v);
  }

  closeChat(): void {
    this.isOpen.set(false);
    this.isMinimized.set(false);
  }

  async sendMessage(): Promise<void> {
    const question = this.messageInput().trim();
    
    if (!question || this.loading()) return;

    // Validar que tengamos projectId
    if (!this.projectId) {
      this.error.set('Project ID is required');
      return;
    }

    // Agregar mensaje del usuario
    const userMessage: ChatMessage = {
      role: 'user',
      content: question,
      timestamp: new Date()
    };
    this.messages.update(msgs => [...msgs, userMessage]);
    
    // Limpiar input
    this.messageInput.set('');
    this.loading.set(true);
    this.error.set(null);

    try {
      const request: any = {
        question: question,
        project_id: this.projectId,
        conversation_id: this.conversationId() || undefined
      };
      const response = await this.aiService.chat(request).toPromise();

      if (response) {
        // Guardar conversation ID
        this.conversationId.set(response.conversation_id);

        // Agregar respuesta del asistente
        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: response.response,
          timestamp: new Date(),
          sources: response.sources,
          suggested_actions: response.suggested_actions
        };
        this.messages.update(msgs => [...msgs, assistantMessage]);
      }
    } catch (err: any) {
      console.error('Error sending message:', err);
      this.error.set(err.error?.error || 'Failed to send message. Please try again.');
      
      // Agregar mensaje de error
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: '❌ Lo siento, ocurrió un error al procesar tu mensaje. Por favor intenta de nuevo.',
        timestamp: new Date()
      };
      this.messages.update(msgs => [...msgs, errorMessage]);
    } finally {
      this.loading.set(false);
    }
  }

  clearConversation(): void {
    this.messages.set([{
      role: 'assistant',
      content: '👋 ¡Hola! Soy tu asistente AI. Puedo ayudarte con información del proyecto, buscar issues, generar resúmenes y más. ¿En qué puedo ayudarte?',
      timestamp: new Date()
    }]);
    this.conversationId.set(null);
    this.messageInput.set('');
    this.error.set(null);
  }

  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }
}

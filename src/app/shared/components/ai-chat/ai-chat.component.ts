import { Component, Input, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AiService, AIChatResponse, AISource } from '../../../core/services/ai.service';
import { IssueDetailModalComponent } from '../issue-detail-modal/issue-detail-modal.component';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: AISource[];  // Backend returns source objects with issue_id, title, similarity
  confidence?: number;
  tokens_used?: number;
  suggested_actions?: string[];
}

@Component({
  selector: 'app-ai-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, IssueDetailModalComponent],
  templateUrl: './ai-chat.component.html',
  styleUrl: './ai-chat.component.css'
})
export class AiChatComponent implements OnInit {
  @Input() projectId!: string;
  
  private aiService = inject(AiService);
  
  // Issue detail modal
  showIssueDetailModal = signal(false);
  selectedIssueId = signal<string | null>(null);

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
      content: '¡Hola! Soy tu asistente AI. Puedo ayudarte con información del proyecto, buscar issues, generar resúmenes y más. ¿En qué puedo ayudarte?',
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
          confidence: response.confidence,
          tokens_used: response.tokens_used,
          suggested_actions: response.suggested_actions
        };
        this.messages.update(msgs => [...msgs, assistantMessage]);
      }
    } catch (err: any) {
      this.error.set(err.error?.error || 'Failed to send message. Please try again.');
      
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: 'Lo siento, ocurrió un error al procesar tu mensaje. Por favor intenta de nuevo.',
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
      content: '¡Hola! Soy tu asistente AI. Puedo ayudarte con información del proyecto, buscar issues, generar resúmenes y más. ¿En qué puedo ayudarte?',
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

  getScorePercentage(score: number): number {
    return Math.round(score * 100);
  }

  getScoreClass(score: number): string {
    if (score >= 0.8) return 'bg-green-100 text-green-800 border border-green-200';
    if (score >= 0.6) return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
    return 'bg-gray-100 text-gray-800 border border-gray-200';
  }

  openIssueDetail(issueId: string, event: MouseEvent): void {
    event.stopPropagation();
    this.selectedIssueId.set(issueId);
    this.showIssueDetailModal.set(true);
  }

  onIssueDetailClosed(): void {
    this.showIssueDetailModal.set(false);
    this.selectedIssueId.set(null);
  }

  onIssueUpdated(): void {
    // Issue was updated, no need to reload anything in chat
  }
}

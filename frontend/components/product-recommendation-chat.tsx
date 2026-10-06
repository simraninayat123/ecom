'use client';

import Link from 'next/link';
import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from 'react';
import { ApiError, AssistantHistoryMessage, formatMoney, OrderCard, RecommendationProduct, sendAssistantMessage } from '../lib/api';
import { useCart } from './cart-provider';

type ChatMessage = {
  id: string;
  role: 'assistant' | 'user';
  text: string;
  products?: RecommendationProduct[];
  orders?: OrderCard[];
  retryQuery?: string;
  noResults?: boolean;
};

const suggestions = [
  "Where's my latest order?",
  'A warm blanket for cool evenings',
  'A useful travel accessory',
  'A thoughtful housewarming gift',
  'Coffee gear for a beginner',
];

const HISTORY_LIMIT = 12;

/** Numbered notes let follow-ups like "add the second one" resolve against the cards the shopper saw. */
function toHistory(messages: ChatMessage[]): AssistantHistoryMessage[] {
  return messages
    .filter((message) => message.id !== 'welcome' && !message.retryQuery)
    .slice(-HISTORY_LIMIT)
    .map((message) => {
      const notes = [
        message.products?.length ? `[Products shown: ${message.products.map((product, index) => `${index + 1}. ${product.name}`).join('; ')}]` : '',
        message.orders?.length ? `[Orders shown: ${message.orders.map((order, index) => `${index + 1}. ${order.reference} (${order.status})`).join('; ')}]` : '',
      ].filter(Boolean);
      return { role: message.role, content: [message.text, ...notes].join('\n').slice(0, 2000) };
    });
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value));
}

const welcomeMessage: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  text: "Hi! Tell me what you need - for example, 'a practical gift for someone who loves coffee' or 'something warm for camping'.",
};

function errorMessage(error: unknown) {
  const status = error instanceof ApiError ? error.status : 0;
  if (status === 429) return "You've sent several requests quickly. Please wait a moment and try again.";
  if (status === 503) return 'The recommendation service is temporarily unavailable. Please try again shortly.';
  return "Sorry, something went wrong on my side. Please try again.";
}

function ProductRecommendationCard({ product }: { product: RecommendationProduct }) {
  const [imageFailed, setImageFailed] = useState(false);
  return (
    <article className="recommendation-card">
      <Link href={`/products/${product.slug}`} className="recommendation-card-link">
        <div className="recommendation-image-wrap">
          {imageFailed ? <div className="recommendation-image-fallback" aria-label="Product image unavailable">No image</div> : <img src={product.imageUrl} alt={product.name} onError={() => setImageFailed(true)} />}
        </div>
        <div className="recommendation-card-content">
          <div className="recommendation-card-heading"><h3>{product.name}</h3><span className="match-label">Good match</span></div>
          {product.category && <p className="recommendation-category">{product.category.name}</p>}
          <p className="recommendation-description">{product.description}</p>
          <div className="recommendation-card-footer"><strong>{formatMoney(product.price, product.currency)}</strong><span className={product.stock > 0 ? 'stock-in' : 'stock-out'}>{product.stock > 0 ? 'In stock' : 'Currently unavailable'}</span></div>
        </div>
      </Link>
      <Link href={`/products/${product.slug}`} className="recommendation-view-link">View product</Link>
    </article>
  );
}

function OrderStatusCard({ order }: { order: OrderCard }) {
  const itemSummary = order.items.map((item) => `${item.quantity} × ${item.name}`).join(', ');
  return (
    <article className="order-card">
      <div className="order-card-heading"><h3>Order #{order.reference}</h3><span className={`order-status order-status-${order.status.toLowerCase()}`}>{order.status.charAt(0) + order.status.slice(1).toLowerCase()}</span></div>
      <p className="order-card-label">{order.statusLabel}</p>
      <p className="order-card-items">{itemSummary}</p>
      <div className="order-card-footer"><span>Placed {formatDate(order.placedAt)}</span><strong>{formatMoney(order.total, order.currency)}</strong></div>
    </article>
  );
}

export function ProductRecommendationChat() {
  const { refresh: refreshCart } = useCart();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [pending, setPending] = useState(false);
  const messagesRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setMessages((current) => current.length ? current : [welcomeMessage]);
      inputRef.current?.focus();
    }
  }, [open]);

  useEffect(() => {
    messagesRef.current?.scrollTo({ top: messagesRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, pending]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  async function submit(query: string) {
    const trimmed = query.trim();
    if (!trimmed || pending) return;
    setInput('');
    const history = toHistory(messages);
    setMessages((current) => [...current, { id: `${Date.now()}-user`, role: 'user', text: trimmed }]);
    setPending(true);
    try {
      const response = await sendAssistantMessage(trimmed, history);
      setMessages((current) => [...current, { id: `${Date.now()}-assistant`, role: 'assistant', text: response.answer, products: response.products, orders: response.orders, noResults: response.answerSource === 'template' && response.products.length === 0 }]);
      if (response.cartUpdated) void refreshCart();
    } catch (error) {
      setMessages((current) => [...current, { id: `${Date.now()}-error`, role: 'assistant', text: errorMessage(error), retryQuery: trimmed }]);
    } finally {
      setPending(false);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    void submit(input);
  }

  function handleInputKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void submit(input);
    }
  }

  return (
    <>
      {open && <div className="recommendation-panel" ref={panelRef} role="dialog" aria-modal="false" aria-labelledby="recommendation-title">
        <header className="recommendation-header">
          <div><h2 id="recommendation-title">Shopping Assistant</h2><p>Products, orders and your cart</p></div>
          <button type="button" className="recommendation-close" aria-label="Close shopping assistant" onClick={() => setOpen(false)}>×</button>
        </header>
        <div className="recommendation-messages" ref={messagesRef} aria-live="polite">
          {messages.map((message) => <div className={`recommendation-message-row ${message.role}`} key={message.id}>
            <div className={`recommendation-message ${message.role}`}>
              <p>{message.text}</p>
              {message.id === 'welcome' && <div className="suggestion-list">{suggestions.map((suggestion) => <button type="button" className="suggestion-chip" key={suggestion} disabled={pending} onClick={() => void submit(suggestion)}>{suggestion}</button>)}</div>}
              {message.orders && message.orders.length > 0 && <div className="recommendation-products">{message.orders.map((order) => <OrderStatusCard key={order.id} order={order} />)}</div>}
              {message.products && message.products.length > 0 && <div className="recommendation-products">{message.products.map((product) => <ProductRecommendationCard key={product.id} product={product} />)}</div>}
              {message.noResults && <p className="recommendation-follow-up">Try mentioning the occasion, budget, category, or who the product is for.</p>}
              {message.retryQuery && <button type="button" className="retry-button" disabled={pending} onClick={() => void submit(message.retryQuery as string)}>Try again</button>}
            </div>
          </div>)}
          {pending && <div className="recommendation-message-row assistant"><div className="recommendation-message assistant typing" aria-label="Assistant is typing"><span></span><span></span><span></span></div></div>}
        </div>
        <p className="recommendation-disclaimer">Answers come from our catalog and your account. Sign in to ask about orders or your cart.</p>
        <form className="recommendation-composer" onSubmit={handleSubmit}>
          <label className="sr-only" htmlFor="recommendation-input">Ask the shopping assistant</label>
          <textarea id="recommendation-input" ref={inputRef} value={input} maxLength={500} rows={2} placeholder="Ask about products, orders or your cart..." onChange={(event) => setInput(event.target.value)} onKeyDown={handleInputKeyDown} disabled={pending} />
          <button type="submit" disabled={pending || !input.trim()}>Send</button>
        </form>
        {input.length >= 450 && <span className="recommendation-count">{input.length}/500</span>}
      </div>}
      <button type="button" className="recommendation-launcher" aria-label="Open shopping assistant" aria-expanded={open} onClick={() => setOpen((current) => !current)}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11.2a7.8 7.8 0 0 1-8 7.8 8.8 8.8 0 0 1-3.3-.6L4 20l1.3-3.8A7.5 7.5 0 0 1 4 11.2 7.8 7.8 0 0 1 12 3.5a7.8 7.8 0 0 1 8 7.7Z" /><path d="M8.5 11.5h.01M12 11.5h.01M15.5 11.5h.01" /></svg>
      </button>
    </>
  );
}
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  X, Star, MessageSquareCode, Phone, Mail, 
  MapPin, CheckCircle2, AlertOctagon, Send, Sparkles, Building2, User 
} from "lucide-react";
import { Supplier, Review } from "../types";

interface SupplierDetailModalProps {
  supplier: Supplier;
  onClose: () => void;
  onAddReview: (supplierId: string, review: Omit<Review, "id" | "date">) => void;
}

export const SupplierDetailModal: React.FC<SupplierDetailModalProps> = ({ 
  supplier, 
  onClose,
  onAddReview 
}) => {
  const [activeTab, setActiveTab] = useState<"catalog" | "reviews" | "contact">("catalog");
  
  // Review form states
  const [authorName, setAuthorName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [userRating, setUserRating] = useState(5);
  const [userComment, setUserComment] = useState("");
  const [reviewSuccess, setReviewSuccess] = useState(false);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(w => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  const isImageLogo = supplier.logo && (
    supplier.logo.startsWith("http://") || 
    supplier.logo.startsWith("https://") || 
    supplier.logo.startsWith("data:") || 
    supplier.logo.startsWith("/")
  );

  const renderLogo = () => {
    if (isImageLogo) {
      return (
        <img
          src={supplier.logo}
          alt={supplier.name}
          className="w-full h-full object-cover rounded-xl"
          referrerPolicy="no-referrer"
        />
      );
    }

    if (supplier.logo && supplier.logo.trim().length <= 4) {
      return (
        <span className="text-3xl select-none leading-none flex items-center justify-center">
          {supplier.logo.trim()}
        </span>
      );
    }

    if (supplier.logo) {
      const emojiMatch = supplier.logo.match(/[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u);
      if (emojiMatch) {
        return (
          <span className="text-3xl select-none leading-none flex items-center justify-center">
            {emojiMatch[0]}
          </span>
        );
      }
      return (
        <span className="text-base font-extrabold text-brand-charcoal uppercase tracking-wider">
          {getInitials(supplier.logo)}
        </span>
      );
    }

    return (
      <>
        <span className="text-lg font-black text-brand-charcoal tracking-wide mt-0.5">
          {getInitials(supplier.name)}
        </span>
        <span className="text-[8px] text-neutral-400 font-extrabold tracking-tighter uppercase font-mono leading-none mt-0.5">CIA</span>
      </>
    );
  };

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authorName.trim() || !userComment.trim()) return;

    onAddReview(supplier.id, {
      author: authorName,
      company: companyName || "Empreendedor Autônomo",
      rating: userRating,
      comment: userComment,
    });

    setReviewSuccess(true);
    setAuthorName("");
    setCompanyName("");
    setUserComment("");
    setUserRating(5);

    setTimeout(() => {
      setReviewSuccess(false);
    }, 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Semi-transparent blur backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-neutral-900/40 backdrop-blur-md"
      />

      {/* Main floating island container (iOS dialog) */}
      <motion.div
        initial={{ scale: 0.93, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.93, opacity: 0, y: 30 }}
        transition={{ type: "spring", damping: 26, stiffness: 320 }}
        className="relative w-full max-w-2xl bg-white/95 text-neutral-900 rounded-[36px] overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,0.18)] border border-neutral-100 max-h-[90vh] flex flex-col z-10"
      >
        {/* Dynamic header */}
        <div className="p-6 pb-4 flex justify-between items-start border-b border-neutral-50">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl flex flex-col items-center justify-center border border-neutral-200 bg-linear-to-b from-neutral-50 to-neutral-100 shadow-inner shrink-0 text-center relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-[4px] z-10 bg-brand-charcoal" />
              {renderLogo()}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold tracking-tight text-neutral-900">
                  {supplier.name}
                </h2>
                {supplier.verified && (
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Homologado
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-neutral-500">
                <span className="font-semibold text-zinc-400 capitalize">{supplier.category}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {supplier.location}
                </span>
              </div>
            </div>
          </div>

          <button 
            id="close-modal-btn"
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-neutral-100 hover:bg-neutral-200/80 active:scale-95 flex items-center justify-center text-neutral-500 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* SOS Delivery Notice */}
        {supplier.fastDelivery && (
          <div className="mx-6 mt-2 bg-brand-red/5 border border-brand-red/10 p-3.5 rounded-[22px] flex items-start gap-3">
            <div className="p-1 px-1.5 bg-brand-red text-white font-bold text-xs rounded-lg flex items-center justify-center animate-pulse">
              <AlertOctagon className="w-4 h-4" />
            </div>
            <div className="text-xs">
              <span className="font-bold text-brand-red block">Este fornecedor faz Entregas Emergenciais!</span>
              <span className="text-neutral-500">Tempo estimado de despacho para itens urgentes: <b className="text-[#2B2B2B]">{supplier.deliveryTime}</b>.</span>
            </div>
          </div>
        )}

        {/* iOS pill tab bar */}
        <div className="p-4 px-6">
          <div className="bg-neutral-100/80 p-1.5 rounded-full flex gap-1">
            <button
              onClick={() => setActiveTab("catalog")}
              className={`flex-1 py-2 px-4 rounded-full text-xs font-semibold tracking-wide transition-all uppercase ${
                activeTab === "catalog"
                  ? "bg-white text-brand-charcoal shadow-sm"
                  : "text-neutral-500 hover:text-[#2B2B2B]"
              }`}
            >
              Catálogo Rápido
            </button>
            <button
              onClick={() => setActiveTab("reviews")}
              className={`flex-1 py-2 px-4 rounded-full text-xs font-semibold tracking-wide transition-all uppercase ${
                activeTab === "reviews"
                  ? "bg-white text-brand-charcoal shadow-sm"
                  : "text-neutral-500 hover:text-[#2B2B2B]"
              }`}
            >
              Avaliações ({supplier.reviewsCount})
            </button>
            <button
              onClick={() => setActiveTab("contact")}
              className={`flex-1 py-2 px-4 rounded-full text-xs font-semibold tracking-wide transition-all uppercase ${
                activeTab === "contact"
                  ? "bg-white text-brand-charcoal shadow-sm"
                  : "text-neutral-500 hover:text-[#2B2B2B]"
              }`}
            >
              Mais Informações
            </button>
          </div>
        </div>

        {/* Tab contents (Scrollable height) */}
        <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-4">
          <AnimatePresence mode="wait">
            {activeTab === "catalog" && (
              <motion.div
                key="catalog-tab"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Produtos Estrela / Serviços Comuns</span>
                  <span className="text-xs text-neutral-500">Pedido Mínimo: R$ {supplier.minOrderValue}</span>
                </div>

                <div className="grid gap-2.5">
                  {supplier.catalogItems.map((item, index) => (
                    <div 
                      key={index}
                      className="p-4 bg-neutral-50/50 rounded-2xl border border-neutral-100/60 flex justify-between items-center hover:bg-neutral-50/80 transition-colors"
                    >
                      <div className="space-y-1">
                        <span className="font-semibold text-neutral-800 text-sm block">
                          {item.name}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] bg-neutral-200/50 text-neutral-600 px-2 py-0.5 rounded-full font-medium">
                            un: {item.unit}
                          </span>
                          {item.immediateAvailable && (
                            <span className="text-[10px] text-brand-red bg-brand-red/5 border border-brand-red/10 px-2 py-0.5 rounded-full font-bold">
                              Estoque SOS Pronto
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-mono text-emerald-700 font-bold text-sm block">
                          {item.price}
                        </span>
                        <span className="text-[10px] text-neutral-400">Entrega imediata</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Info Tip */}
                <p className="text-xs text-neutral-400 leading-relaxed text-center italic mt-2">
                  *Os valores acima são aproximados e dependem de cotação direta em lote pelo WhatsApp oficial.
                </p>
              </motion.div>
            )}

            {activeTab === "reviews" && (
              <motion.div
                key="reviews-tab"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                className="space-y-6"
              >
                {/* Visual score matrix */}
                <div className="bg-neutral-50 rounded-[28px] p-5 flex items-center justify-between border border-neutral-100/50">
                  <div className="space-y-1">
                    <span className="text-4xl font-black font-mono leading-none tracking-tight block">
                      {supplier.rating.toFixed(1)}
                    </span>
                    <span className="text-xs text-neutral-400 font-medium block">De um total de {supplier.reviewsCount} avaliações</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className="flex text-amber-400 mb-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star 
                          key={i} 
                          className={`w-5 h-5 ${i < Math.round(supplier.rating) ? "fill-amber-400 stroke-amber-400" : "text-neutral-200"}`} 
                        />
                      ))}
                    </div>
                    <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 animate-pulse" /> 100% Recomendado
                    </span>
                  </div>
                </div>

                {/* Submitting a new live review mock */}
                <div className="bg-white rounded-[28px] border border-neutral-100 p-5 space-y-4 shadow-[0_8px_24px_rgba(0,0,0,0.02)]">
                  <h4 className="font-bold text-neutral-900 text-sm flex items-center gap-1.5">
                    <MessageSquareCode className="w-4 h-4 text-amber-500" />
                    Balanço de Opinião: Deixe sua Avaliação Real
                  </h4>

                  {reviewSuccess ? (
                    <div className="bg-emerald-50 text-emerald-800 p-4 rounded-2xl text-xs font-semibold text-center animate-fade-in">
                      Avaliação enviada com sucesso! Ela foi computada para a média deste fornecedor em tempo de execução.
                    </div>
                  ) : (
                    <form onSubmit={handleSubmitReview} className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="relative">
                          <User className="absolute left-3.5 top-3 w-4 h-4 text-neutral-400" />
                          <input 
                            type="text" 
                            placeholder="Seu Nome completo" 
                            required 
                            value={authorName}
                            onChange={(e) => setAuthorName(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 hover:bg-neutral-100/50 focus:bg-white text-xs font-medium rounded-xl border border-neutral-200/50 outline-none focus:ring-1 focus:ring-amber-500 transition-all text-neutral-800"
                          />
                        </div>
                        <div className="relative">
                          <Building2 className="absolute left-3.5 top-3 w-4 h-4 text-neutral-400" />
                          <input 
                            type="text" 
                            placeholder="Nome de sua Empresa (Insumo)" 
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 hover:bg-neutral-100/50 focus:bg-white text-xs font-medium rounded-xl border border-neutral-200/50 outline-none focus:ring-1 focus:ring-amber-500 transition-all text-neutral-800"
                          />
                        </div>
                      </div>

                      {/* Stars slider */}
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-medium text-neutral-500">Nota atribuída:</span>
                        <div className="flex gap-1.5">
                          {Array.from({ length: 5 }).map((_, index) => {
                            const starNum = index + 1;
                            return (
                              <button
                                type="button"
                                key={index}
                                onClick={() => setUserRating(starNum)}
                                className="focus:outline-none transition-transform active:scale-125 cursor-pointer"
                              >
                                <Star 
                                  className={`w-6 h-6 ${
                                    starNum <= userRating 
                                      ? "fill-amber-400 stroke-amber-400" 
                                      : "text-neutral-200 hover:text-neutral-300"
                                  }`} 
                                />
                              </button>
                            );
                          })}
                        </div>
                        <span className="text-xs font-bold text-neutral-700 font-mono">({userRating}/5)</span>
                      </div>

                      <div>
                        <textarea 
                          rows={2}
                          placeholder="Fale se a entrega foi pontual, se a qualidade correspondeu ao prometido..."
                          required
                          value={userComment}
                          onChange={(e) => setUserComment(e.target.value)}
                          className="w-full p-3 bg-neutral-50 hover:bg-neutral-100/50 focus:bg-white text-xs font-medium rounded-xl border border-neutral-200/50 outline-none focus:ring-1 focus:ring-amber-500 transition-all text-neutral-800"
                        />
                      </div>

                      <button 
                        type="submit"
                        className="w-full py-2.5 bg-brand-charcoal hover:bg-brand-charcoal/90 active:scale-95 border-none text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
                      >
                        <Send className="w-4 h-4" /> Enviar Avaliação Integradora
                      </button>
                    </form>
                  )}
                </div>

                {/* List of client reviews */}
                <div className="space-y-3">
                  <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider block">Relato de outros Empreendedores</span>
                  {supplier.reviews.length === 0 ? (
                    <p className="text-xs text-neutral-400 italic text-center">Nenhuma avaliação deixada ainda. Seja o primeiro!</p>
                  ) : (
                    supplier.reviews.map((rev) => (
                      <div 
                        key={rev.id}
                        className="p-4 bg-neutral-50/40 rounded-2xl border border-neutral-100 space-y-2.5"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-semibold text-neutral-800 text-sm block">{rev.author}</span>
                            <span className="text-[10px] text-neutral-400">{rev.company}</span>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <div className="flex text-amber-400">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star 
                                  key={i} 
                                  className={`w-3 h-3 ${i < rev.rating ? "fill-amber-400 stroke-amber-400" : "text-neutral-200"}`} 
                                />
                              ))}
                            </div>
                            <span className="text-[10px] text-neutral-400">{rev.date}</span>
                          </div>
                        </div>
                        <p className="text-xs text-neutral-600 leading-relaxed italic">
                          "{rev.comment}"
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === "contact" && (
              <motion.div
                key="contact-tab"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                className="space-y-4"
              >
                <div className="p-4 bg-neutral-50/50 rounded-2xl border border-neutral-100/60 text-xs space-y-3">
                  <div className="flex items-center gap-2.5 text-neutral-700">
                    <MapPin className="w-4 h-4 text-neutral-400 shrink-0" />
                    <div>
                      <span className="font-bold text-neutral-800 block">Área de Atendimento Presencial:</span>
                      <span>{supplier.location}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 text-neutral-700">
                    <Phone className="w-4 h-4 text-neutral-400 shrink-0" />
                    <div>
                      <span className="font-bold text-neutral-800 block">Telefone Comercial Fixo:</span>
                      <span>{supplier.contactPhone}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 text-neutral-700">
                    <Mail className="w-4 h-4 text-neutral-400 shrink-0" />
                    <div>
                      <span className="font-bold text-neutral-800 block">E-mail Corporativo:</span>
                      <span>{supplier.contactEmail}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-100/50 text-xs leading-relaxed text-neutral-600">
                  <span className="font-bold text-amber-800 block mb-1">Dica de Negociação Segura:</span>
                  Ao entrar em contato pelo Hub, informe detalhadamente sua emergência (por exemplo: "Sou do restaurante X, acabou meu combustível P45 no pico!"). Isso fará com que o despachante priorize sua entrega imediatamente no cronograma de rotas.
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer Contact bar */}
        <div className="p-5 border-t border-neutral-50 bg-neutral-50/80 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="text-xs text-neutral-400 text-center sm:text-left">
            <span>Ao clicar em Chamar, o WhatsApp abrirá com pre-msg.</span>
          </div>

          <a 
            href={supplier.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-6 py-3 bg-[#25D366] hover:bg-[#20ba56] text-white font-bold text-sm rounded-full flex items-center justify-center gap-2.5 shadow-md shadow-emerald-500/10 active:scale-95 transition-all text-center border-none"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 shrink-0">
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.1 1.4 4.5 1.4 5.3 0 9.7-4.3 9.7-9.7s-4.3-9.7-9.7-9.7S1.4 5.5 1.4 10.9c0 1.6.45 3.1 1.3 4.5l-.9 3.3 3.3-.9zm11.5-6.1c-.3-.1-1.7-.8-2-1-.3-.1-.5-.1-.7.2-.2.3-.7 1-.9 1.2-.2.2-.4.2-.7.1-.3-.1-1.4-.5-2.6-1.6-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6.1-.1.3-.3.4-.5.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5C10 7.9 9.3 6.2 9 5.5c-.3-.7-.6-.6-.8-.6h-.7c-.2 0-.6.1-.9.4s-1.2 1.2-1.2 3 1.3 3.5 1.5 3.7c.2.3 2.5 3.8 6 5.3.8.3 1.5.6 2 .7.8.3 1.6.2 2.2.1.7-.1 2-.8 2.3-1.6.3-.8.3-1.4.2-1.6-.1-.2-.3-.3-.6-.4z"/>
            </svg>
            <span>PEDIR ENTREGA IMEDIATA</span>
          </a>
        </div>
      </motion.div>
    </div>
  );
};

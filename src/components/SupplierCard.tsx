/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { motion } from "motion/react";
import { Star, MapPin, Clock, CheckCircle2, AlertCircle, Coins } from "lucide-react";
import { Supplier } from "../types";

interface SupplierCardProps {
  supplier: Supplier;
  onClick: () => void;
}

export const SupplierCard: React.FC<SupplierCardProps> = ({ supplier, onClick }) => {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(word => word[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  const initials = getInitials(supplier.name);

  // Check if logo is a web URL, base64 image or a path
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

    // Strip any emoji from logo text if there is one to comply with 'no emojis' guidelines
    const cleanLogoText = supplier.logo ? supplier.logo.replace(/[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/ug, "").trim() : "";
    const displayInitials = (cleanLogoText && cleanLogoText.length <= 4) ? cleanLogoText : initials;

    return (
      <div className="flex flex-col items-center justify-center">
        <span className="text-sm font-black text-neutral-900 tracking-wider font-mono">
          {displayInitials}
        </span>
        <span className="text-[7px] text-neutral-500 font-extrabold tracking-widest uppercase font-mono mt-0.5">
          HUB
        </span>
      </div>
    );
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      whileHover={{ y: -4, scale: 1.015 }}
      transition={{ type: "spring", stiffness: 350, damping: 30 }}
      onClick={onClick}
      className="relative cursor-pointer group flex flex-col justify-between p-6 bg-white min-h-[280px] rounded-[32px] border border-neutral-100 hover:border-neutral-200/90 shadow-[0_16px_36px_rgba(0,0,0,0.03),0_1px_2px_rgba(0,0,0,0.01)]"
    >
      {/* Main Info */}
      <div className="space-y-4">
        {/* Header Block */}
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl flex flex-col items-center justify-center border border-neutral-200 bg-linear-to-b from-neutral-50 to-neutral-100 shadow-inner group-hover:from-white group-hover:to-neutral-50 transition-colors shrink-0 text-center relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-[3px] z-10 bg-brand-charcoal" />
            {renderLogo()}
          </div>
          <div className="space-y-1 max-w-[calc(100%-70px)]">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="font-semibold text-brand-charcoal text-base leading-tight group-hover:text-brand-red transition-colors">
                {supplier.name}
              </h3>
              {supplier.verified && (
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" title="Fornecedor Homologado" />
              )}
              {supplier.fastDelivery && (
                <span className="inline-flex items-center gap-0.5 bg-brand-red/5 text-brand-red px-2 py-0.5 rounded-full text-[9px] font-extrabold tracking-wider border border-brand-red/10 shrink-0 uppercase">
                  <AlertCircle className="w-2.5 h-2.5 animate-pulse text-brand-red" />
                  <span>ENTREGA IMEDIATA</span>
                </span>
              )}
            </div>
            <p className="text-xs text-neutral-400 font-medium tracking-wide uppercase">
              {supplier.category === "embalagens" && "Embalagens & Descartáveis"}
              {supplier.category === "alimentos" && "Alimentos & Insumos"}
              {supplier.category === "gas_energia" && "Gás & Energia"}
              {supplier.category === "logistica" && "Logística de Coleta"}
              {supplier.category === "manutencao" && "Suporte & Assistência"}
              {supplier.category === "grafica" && "Serviços de Impressão"}
            </p>
          </div>
        </div>

        {/* Short description */}
        <p className="text-sm text-neutral-500 line-clamp-2 leading-relaxed">
          {supplier.description}
        </p>
      </div>

      {/* Meta indicators */}
      <div className="pt-4 border-t border-neutral-50/80 space-y-3">
        {/* Delivery speed & rating row */}
        <div className="flex items-center justify-between text-xs text-neutral-600">
          <div className="flex items-center gap-1.5 font-medium">
            <Clock className={`w-4 h-4 ${supplier.fastDelivery ? "text-brand-red" : "text-neutral-400"}`} />
            <span className={supplier.fastDelivery ? "text-brand-red font-bold" : ""}>
              {supplier.deliveryTime}
            </span>
          </div>

          <div className="flex items-center gap-1 bg-amber-50/50 px-2 py-0.5 rounded-lg text-amber-700 font-semibold">
            <Star className="w-3.5 h-3.5 fill-amber-400 stroke-amber-400" />
            <span>{supplier.rating.toFixed(1)}</span>
            <span className="text-[10px] text-neutral-400 font-normal">({supplier.reviewsCount})</span>
          </div>
        </div>

        {/* Location & Min Order row */}
        <div className="flex items-center justify-between text-xs text-neutral-500">
          <div className="flex items-center gap-1 max-w-[65%] truncate">
            <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
            <span className="truncate">{supplier.location}</span>
          </div>

          <div className="flex items-center gap-1 text-neutral-600 font-medium shrink-0">
            <Coins className="w-3.5 h-3.5 text-neutral-400" />
            <span>Mín: R$ {supplier.minOrderValue}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

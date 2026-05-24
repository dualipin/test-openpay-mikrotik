#!/bin/bash

# Script de Configuración Rápida - MikroTik + OpenPay

echo "╔════════════════════════════════════════════════════════════╗"
echo "║   MikroTik RouterOS + OpenPay - Setup Rápido             ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}✗${NC} Node.js no está instalado"
    exit 1
fi
echo -e "${GREEN}✓${NC} Node.js $(node -v) encontrado"

# Backend
echo ""
echo "📦 Instalando dependencias del Backend..."
cd api
npm install openpay node-routeros 2>/dev/null
echo -e "${GREEN}✓${NC} Backend listo"

# Frontend
echo ""
echo "📦 Instalando dependencias del Frontend..."
cd ../web
npm install 2>/dev/null
echo -e "${GREEN}✓${NC} Frontend listo"

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║              PRÓXIMOS PASOS                                ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "1️⃣  Configura las variables de entorno:"
echo "    • Edita: api/.env"
echo "    • Edita: web/.env"
echo ""
echo "2️⃣  Asegúrate que MikroTik está accesible:"
echo "    • IP: 192.168.1.77"
echo "    • Usuario: admin"
echo "    • Contraseña: admin"
echo "    • API Puerto: 8728"
echo ""
echo "3️⃣  Inicia los servidores:"
echo "    • Backend: cd api && npm run dev"
echo "    • Frontend: cd web && npm run dev"
echo ""
echo "4️⃣  Abre el navegador:"
echo "    • http://localhost:5173"
echo ""
echo "📚 Documentación:"
echo "   • MIKROTIK.md - Guía completa de integración"
echo "   • INTEGRATION.md - Sistema de pagos"
echo ""

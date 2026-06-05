const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Middleware para interpretar JSON e servir os arquivos estáticos do front-end
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Caminho absoluto para a subpasta DB e o arquivo sterilisation.db
const dbPath = path.join(__dirname, 'DB', 'sterilisation.db');

// Verificar se a pasta DB existe, se não, criar
if (!fs.existsSync(path.join(__dirname, 'DB'))) {
    fs.mkdirSync(path.join(__dirname, 'DB'), { recursive: true });
    console.log('✓ Pasta DB criada');
}

// Conexão com o banco de dados SQLite
let db;

function connectDatabase() {
    return new Promise((resolve, reject) => {
        db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
            if (err) {
                console.error('================================================================');
                console.error('❌ Erro de conexão à base de dados:', err.message);
                console.error('Caminho tentado:', dbPath);
                console.error('Arquivo existe?', fs.existsSync(dbPath));
                console.error('================================================================');
                reject(err);
            } else {
                console.log('----------------------------------------------------------------');
                console.log('✓ Sucesso: Conectado à base de dados');
                console.log('Caminho:', dbPath);
                console.log('Arquivo existe?', fs.existsSync(dbPath));
                console.log('Tamanho do arquivo:', fs.statSync(dbPath).size, 'bytes');
                console.log('----------------------------------------------------------------');
                
                // Configurar timeouts e tratamento de erro
                db.configure("busyTimeout", 5000); // Aguardar 5 segundos se estiver ocupado
                
                resolve();
            }
        });

        db.on('error', (err) => {
            console.error('❌ Erro de banco de dados:', err.message);
        });
    });
}

// Função para inicializar as tabelas
async function initDatabase() {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            db.run("PRAGMA foreign_keys = ON");

            // 1. Criar tabela de Autoclaves
            db.run(`CREATE TABLE IF NOT EXISTS autoclaves (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nom TEXT NOT NULL UNIQUE,
                cree_dans TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`, (err) => {
                if (err) {
                    console.error("❌ Erro ao criar tabela autoclaves:", err.message);
                } else {
                    console.log("✓ Tabela 'autoclaves' pronta");
                }
            });

            // 2. Criar tabela de Responsáveis
            db.run(`CREATE TABLE IF NOT EXISTS responsables (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nom TEXT NOT NULL UNIQUE,
                cree_dans TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`, (err) => {
                if (err) {
                    console.error("❌ Erro ao criar tabela responsables:", err.message);
                } else {
                    console.log("✓ Tabela 'responsables' pronta");
                }
            });

            // 3. Criar tabela de Archives
            db.run(`CREATE TABLE IF NOT EXISTS archives (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                autoclave_id INTEGER NOT NULL,
                responsable_id INTEGER NOT NULL,
                cycle INTEGER NOT NULL,
                date DATE NOT NULL,
                valide DATE NOT NULL,
                temperateur REAL NOT NULL,
                pression REAL NOT NULL,
                quantites INTEGER NOT NULL,
                cree_dans TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(autoclave_id) REFERENCES autoclaves(id) ON DELETE CASCADE,
                FOREIGN KEY(responsable_id) REFERENCES responsables(id) ON DELETE CASCADE
            )`, (err) => {
                if (err) {
                    console.error("❌ Erro ao criar tabela archives:", err.message);
                } else {
                    console.log("✓ Tabela 'archives' pronta");
                }
            });

            // Aguardar 1 segundo para garantir que as tabelas foram criadas
            setTimeout(() => {
                resolve();
            }, 1000);
        });
    });
}

// ================= API ROUTES =================

// --- 1. BUSCAR TODOS OS ARCHIVES ---
app.get('/archives', (req, res) => {
    const sql = `
        SELECT 
            arc.id,
            auto.nom AS autoclave,
            resp.nom AS responsable,
            arc.cycle,
            arc.date,
            arc.valide AS validate,
            arc.temperateur AS temperature,
            arc.pression,
            arc.quantites AS quantite
        FROM archives arc
        LEFT JOIN autoclaves auto ON arc.autoclave_id = auto.id
        LEFT JOIN responsables resp ON arc.responsable_id = resp.id
        ORDER BY arc.id DESC
    `;
    
    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error("[SQLite Erro GET /archives]:", err.message);
            return res.status(500).json({ error: err.message });
        }
        res.json(rows || []);
    });
});

// --- 2. GRAVAR NOVO ARCHIVE ---
app.post('/archives', (req, res) => {
    const { autoclave, responsable, cycle, date, validate, temperature, pression, quantite } = req.body;

    if (!autoclave || !responsable || cycle === undefined || !date || !validate) {
        return res.status(400).json({ error: "Campos obrigatórios faltando." });
    }

    db.get("SELECT id FROM autoclaves WHERE nom = ?", [autoclave], (err, autoRow) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!autoRow) return res.status(400).json({ error: "Autoclave introuvable." });

        db.get("SELECT id FROM responsables WHERE nom = ?", [responsable], (err, respRow) => {
            if (err) return res.status(500).json({ error: err.message });
            if (!respRow) return res.status(400).json({ error: "Responsable introuvable." });

            const sql = `
                INSERT INTO archives (autoclave_id, responsable_id, cycle, date, valide, temperateur, pression, quantites) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `;
            
            db.run(sql, [
                autoRow.id, 
                respRow.id, 
                parseInt(cycle, 10), 
                date, 
                validate, 
                parseFloat(temperature), 
                parseFloat(pression), 
                parseInt(quantite, 10)
            ], function(err) {
                if (err) {
                    console.error("[SQLite Erro POST /archives]:", err.message);
                    return res.status(500).json({ error: err.message });
                }
                res.json({ id: this.lastID, ...req.body });
            });
        });
    });
});

// --- 3. MODIFICAR ARCHIVE ---
app.put('/archives/:id', (req, res) => {
    const { autoclave, responsable, cycle, date, validate, temperature, pression, quantite } = req.body;

    db.get("SELECT id FROM autoclaves WHERE nom = ?", [autoclave], (err, autoRow) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!autoRow) return res.status(400).json({ error: "Autoclave introuvable." });

        db.get("SELECT id FROM responsables WHERE nom = ?", [responsable], (err, respRow) => {
            if (err) return res.status(500).json({ error: err.message });
            if (!respRow) return res.status(400).json({ error: "Responsable introuvable." });

            const sql = `
                UPDATE archives 
                SET autoclave_id=?, responsable_id=?, cycle=?, date=?, valide=?, temperateur=?, pression=?, quantites=? 
                WHERE id=?
            `;
            
            db.run(sql, [
                autoRow.id, 
                respRow.id, 
                parseInt(cycle, 10), 
                date, 
                validate, 
                parseFloat(temperature), 
                parseFloat(pression), 
                parseInt(quantite, 10),
                req.params.id
            ], (err) => {
                if (err) {
                    console.error("[SQLite Erro PUT /archives]:", err.message);
                    return res.status(500).json({ error: err.message });
                }
                res.json({ success: true });
            });
        });
    });
});

// --- 4. DELETAR ARCHIVE ---
app.delete('/archives/:id', (req, res) => {
    db.run("DELETE FROM archives WHERE id = ?", [req.params.id], (err) => {
        if (err) {
            console.error("[SQLite Erro DELETE /archives]:", err.message);
            return res.status(500).json({ error: err.message });
        }
        res.json({ success: true });
    });
});

// --- 5. BUSCAR TODAS AS AUTOCLAVES ---
app.get('/autoclaves', (req, res) => {
    db.all("SELECT nom FROM autoclaves ORDER BY nom ASC", [], (err, rows) => {
        if (err) {
            console.error("[SQLite Erro GET /autoclaves]:", err.message);
            return res.status(500).json({ error: err.message });
        }
        const list = rows ? rows.map(row => row.nom) : [];
        res.json(list);
    });
});

// --- 6. GRAVAR NOVA AUTOCLAVE ---
app.post('/autoclaves', (req, res) => {
    const name = req.body.name || req.body.nom;
    if (!name || name.trim() === '') {
        return res.status(400).json({ error: "Le nom est obligatoire." });
    }

    db.run("INSERT INTO autoclaves (nom) VALUES (?)", [name.trim()], function(err) {
        if (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
                return res.status(400).json({ error: "Cette autoclave existe déjà." });
            }
            console.error("[SQLite Erro POST /autoclaves]:", err.message);
            return res.status(500).json({ error: err.message });
        }
        res.json({ success: true, id: this.lastID });
    });
});

// --- 7. DELETAR AUTOCLAVE ---
app.delete('/autoclaves/:name', (req, res) => {
    db.run("DELETE FROM autoclaves WHERE nom = ?", [req.params.name], (err) => {
        if (err) {
            console.error("[SQLite Erro DELETE /autoclaves]:", err.message);
            return res.status(500).json({ error: err.message });
        }
        res.json({ success: true });
    });
});

// --- 8. BUSCAR TODOS OS RESPONSABLES ---
app.get('/responsables', (req, res) => {
    db.all("SELECT nom FROM responsables ORDER BY nom ASC", [], (err, rows) => {
        if (err) {
            console.error("[SQLite Erro GET /responsables]:", err.message);
            return res.status(500).json({ error: err.message });
        }
        const list = rows ? rows.map(row => row.nom) : [];
        res.json(list);
    });
});

// --- 9. GRAVAR NOVO RESPONSABLE ---
app.post('/responsables', (req, res) => {
    const name = req.body.name || req.body.nom;
    if (!name || name.trim() === '') {
        return res.status(400).json({ error: "Le nom est obligatoire." });
    }

    db.run("INSERT INTO responsables (nom) VALUES (?)", [name.trim()], function(err) {
        if (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
                return res.status(400).json({ error: "Ce responsable existe déjà." });
            }
            console.error("[SQLite Erro POST /responsables]:", err.message);
            return res.status(500).json({ error: err.message });
        }
        res.json({ success: true, id: this.lastID });
    });
});

// --- 10. DELETAR RESPONSABLE ---
app.delete('/responsables/:name', (req, res) => {
    db.run("DELETE FROM responsables WHERE nom = ?", [req.params.name], (err) => {
        if (err) {
            console.error("[SQLite Erro DELETE /responsables]:", err.message);
            return res.status(500).json({ error: err.message });
        }
        res.json({ success: true });
    });
});

// --- Health check endpoint ---
app.get('/health', (req, res) => {
    res.json({ status: 'OK', server: 'running' });
});

// ================= INICIALIZAR O SERVIDOR =================

async function startServer() {
    try {
        await connectDatabase();
        await initDatabase();
        
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`\n${'='.repeat(60)}`);
            console.log(`✓ Servidor rodando em http://localhost:${PORT}`);
            console.log(`${'='.repeat(60)}\n`);
        });
    } catch (err) {
        console.error('Erro ao iniciar servidor:', err.message);
        process.exit(1);
    }
}

startServer();
const express = require('express');
const initSqlJs = require('sql.js');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

let db;
const DB_PATH = './infinix_kanban.db';

async function initDB() {
  const SQL = await initSqlJs();
  
  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS product_lines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_line_id INTEGER,
      name TEXT NOT NULL,
      year INTEGER,
      stage TEXT,
      specs TEXT,
      price_range TEXT,
      market_feedback TEXT,
      feedback_type TEXT,
      cmf_summary TEXT,
      problem_review TEXT,
      next_gen_suggestion TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_line_id) REFERENCES product_lines(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      image_type TEXT NOT NULL,
      image_data TEXT NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS colors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      color_name TEXT NOT NULL,
      color_code TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    )
  `);

  const initProductLines = [
    { name: 'GT', description: 'Gaming & Technology - 高端游戏系列' },
    { name: 'NOTE', description: 'Note系列 - 商务拍照旗舰' },
    { name: 'HOT', description: 'Hot系列 - 年轻时尚入门' },
    { name: 'SMT', description: 'Smart Technology - 智能科技高端' }
  ];

  initProductLines.forEach(line => {
    db.run('INSERT OR IGNORE INTO product_lines (name, description) VALUES (?, ?)', [line.name, line.description]);
  });

  const lineIdMap = {};
  const lines = db.exec('SELECT id, name FROM product_lines');
  if (lines.length > 0) {
    lines[0].values.forEach(row => { lineIdMap[row[1]] = row[0]; });
  }

  const sampleProducts = [
    { line: 'GT', name: 'GT 15 Pro', year: 2024, stage: '已上市', specs: '骁龙8 Gen3, 12GB+256GB', price_range: '¥2,999-3,499', market_feedback: '性能强劲，游戏体验优秀', feedback_type: 'positive', cmf_summary: 'AG磨砂玻璃背板，金属中框，荧光绿点缀', problem_review: '机身略重(228g)，散热可优化', next_gen_suggestion: '轻量化设计，升级散热系统' },
    { line: 'GT', name: 'GT 16', year: 2025, stage: '研发中', specs: '骁龙8+ Gen4, 16GB+512GB', price_range: '¥3,299-3,899', market_feedback: '', feedback_type: '', cmf_summary: '探索中', problem_review: '', next_gen_suggestion: '计划采用新型散热材料' },
    { line: 'NOTE', name: 'NOTE 40 Pro', year: 2024, stage: '已上市', specs: '天玑7020, 8GB+256GB', price_range: '¥1,599-1,899', market_feedback: '拍照效果出色，续航优秀', feedback_type: 'positive', cmf_summary: '素皮背板，星光纹理，极简设计', problem_review: '低光拍摄噪点', next_gen_suggestion: '提升夜景模式算法' },
    { line: 'NOTE', name: 'NOTE 50', year: 2025, stage: '设计中', specs: '天玑7300, 12GB+512GB', price_range: '¥1,999-2,399', market_feedback: '', feedback_type: '', cmf_summary: '计划采用竹纤维材料', problem_review: '', next_gen_suggestion: '环保材质+旗舰影像' },
    { line: 'HOT', name: 'HOT 30i', year: 2024, stage: '已上市', specs: 'Helio G85, 4GB+128GB', price_range: '¥799-999', market_feedback: '性价比极高，学生群体好评', feedback_type: 'positive', cmf_summary: '塑料注塑背板，渐变镀膜', problem_review: '塑料边框质感一般', next_gen_suggestion: '提升外观质感' },
    { line: 'HOT', name: 'HOT 40', year: 2025, stage: '已上市', specs: 'Helio G88, 6GB+128GB', price_range: '¥899-1,099', market_feedback: '入门机首选', feedback_type: 'positive', cmf_summary: '采用镀膜工艺', problem_review: '', next_gen_suggestion: '' },
    { line: 'SMT', name: 'SMT 10 Ultra', year: 2024, stage: '概念阶段', specs: '待定', price_range: '待定', market_feedback: '', feedback_type: '', cmf_summary: '计划钛合金边框+陶瓷背板', problem_review: '', next_gen_suggestion: '高端材质探索' }
  ];

  sampleProducts.forEach(p => {
    const existing = db.exec('SELECT id FROM products WHERE name = ?', [p.name]);
    if (existing.length === 0 || existing[0].values.length === 0) {
      db.run(`INSERT INTO products (product_line_id, name, year, stage, specs, price_range, market_feedback, feedback_type, cmf_summary, problem_review, next_gen_suggestion) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [lineIdMap[p.line], p.name, p.year, p.stage, p.specs, p.price_range, p.market_feedback, p.feedback_type, p.cmf_summary, p.problem_review, p.next_gen_suggestion]);
    }
  });

  saveDB();
}

function saveDB() {
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

function queryAll(sql, params = []) {
  const stmt = db.prepare(sql);
  if (params.length > 0) stmt.bind(params);
  const results = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

function queryOne(sql, params = []) {
  const results = queryAll(sql, params);
  return results.length > 0 ? results[0] : null;
}

function run(sql, params = []) {
  db.run(sql, params);
  saveDB();
  return { lastInsertRowid: db.exec('SELECT last_insert_rowid()')[0].values[0][0] };
}

app.get('/api/products', (req, res) => {
  try {
    const { line, year, stage, color } = req.query;
    let query = `SELECT p.*, pl.name as line_name FROM products p JOIN product_lines pl ON p.product_line_id = pl.id WHERE 1=1`;
    const params = [];

    if (line) { query += ' AND pl.name = ?'; params.push(line); }
    if (year) { query += ' AND p.year = ?'; params.push(year); }
    if (stage) { query += ' AND p.stage = ?'; params.push(stage); }
    if (color) { query += ' AND p.id IN (SELECT product_id FROM colors WHERE color_name LIKE ?)'; params.push(`%${color}%`); }

    query += ' ORDER BY pl.name, p.year DESC, p.id DESC';
    const products = queryAll(query, params);

    products.forEach(p => {
      p.images = queryAll('SELECT * FROM images WHERE product_id = ?', [p.id]);
      p.colors = queryAll('SELECT * FROM colors WHERE product_id = ?', [p.id]);
    });

    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/products/:id', (req, res) => {
  try {
    const product = queryOne('SELECT p.*, pl.name as line_name FROM products p JOIN product_lines pl ON p.product_line_id = pl.id WHERE p.id = ?', [req.params.id]);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    product.images = queryAll('SELECT * FROM images WHERE product_id = ?', [product.id]);
    product.colors = queryAll('SELECT * FROM colors WHERE product_id = ?', [product.id]);
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/products', (req, res) => {
  try {
    const { product_line_id, name, year, stage, specs, price_range, market_feedback, feedback_type, cmf_summary, problem_review, next_gen_suggestion, images, colors } = req.body;

    const result = run(`INSERT INTO products (product_line_id, name, year, stage, specs, price_range, market_feedback, feedback_type, cmf_summary, problem_review, next_gen_suggestion) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [product_line_id, name, year, stage, specs, price_range, market_feedback, feedback_type, cmf_summary, problem_review, next_gen_suggestion]);

    const productId = result.lastInsertRowid;

    if (images && images.length > 0) {
      images.forEach(img => {
        run('INSERT INTO images (product_id, image_type, image_data, description) VALUES (?, ?, ?, ?)', [productId, img.image_type, img.image_data, img.description || '']);
      });
    }

    if (colors && colors.length > 0) {
      colors.forEach(c => {
        run('INSERT INTO colors (product_id, color_name, color_code) VALUES (?, ?, ?)', [productId, c.color_name, c.color_code]);
      });
    }

    res.json({ id: productId, message: 'Product created successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/products/:id', (req, res) => {
  try {
    const { product_line_id, name, year, stage, specs, price_range, market_feedback, feedback_type, cmf_summary, problem_review, next_gen_suggestion, images, colors } = req.body;

    run(`UPDATE products SET product_line_id = ?, name = ?, year = ?, stage = ?, specs = ?, price_range = ?, market_feedback = ?, feedback_type = ?, cmf_summary = ?, problem_review = ?, next_gen_suggestion = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [product_line_id, name, year, stage, specs, price_range, market_feedback, feedback_type, cmf_summary, problem_review, next_gen_suggestion, req.params.id]);

    if (images) {
      run('DELETE FROM images WHERE product_id = ?', [req.params.id]);
      images.forEach(img => {
        run('INSERT INTO images (product_id, image_type, image_data, description) VALUES (?, ?, ?, ?)', [req.params.id, img.image_type, img.image_data, img.description || '']);
      });
    }

    if (colors) {
      run('DELETE FROM colors WHERE product_id = ?', [req.params.id]);
      colors.forEach(c => {
        run('INSERT INTO colors (product_id, color_name, color_code) VALUES (?, ?, ?)', [req.params.id, c.color_name, c.color_code]);
      });
    }

    res.json({ message: 'Product updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/products/:id', (req, res) => {
  try {
    run('DELETE FROM products WHERE id = ?', [req.params.id]);
    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/stats', (req, res) => {
  try {
    const stats = {
      total: queryOne('SELECT COUNT(*) as count FROM products').count,
      byLine: queryAll('SELECT pl.name, COUNT(p.id) as count FROM product_lines pl LEFT JOIN products p ON pl.id = p.product_line_id GROUP BY pl.id, pl.name'),
      byStage: queryAll('SELECT stage, COUNT(*) as count FROM products WHERE stage IS NOT NULL GROUP BY stage'),
      recentUpdates: queryAll('SELECT p.id, p.name, p.updated_at FROM products p ORDER BY p.updated_at DESC LIMIT 5')
    };
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/lines', (req, res) => {
  try {
    const lines = queryAll('SELECT * FROM product_lines ORDER BY name');
    res.json(lines);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

async function start() {
  await initDB();
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Infinix Kanban Server running on http://0.0.0.0:${PORT}`);
  });
}

start();
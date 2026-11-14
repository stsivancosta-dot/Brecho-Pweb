import { useEffect, useMemo, useState } from "react";
import { api } from "./api";

const CATEGORIAS = [
  { value: "UNIFORME", label: "Uniforme" },
  { value: "MATERIAL_ESCOLAR", label: "Material escolar" },
  { value: "LIVRO", label: "Livro" },
  { value: "ELETRONICO", label: "Eletrônico" },
  { value: "OUTRO", label: "Outro" }
];

const ESTADOS = [
  { value: "NOVO", label: "Novo" },
  { value: "BOM", label: "Bom" },
  { value: "USADO", label: "Usado" }
];

function formatLabel(val) {
  if (!val) return "";
  const foundCat = CATEGORIAS.find(c => c.value === val);
  if (foundCat) return foundCat.label;
  const foundEst = ESTADOS.find(e => e.value === val);
  if (foundEst) return foundEst.label;
  return val.charAt(0).toUpperCase() + val.slice(1).toLowerCase();
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const meses = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  const dia = String(d.getDate()).padStart(2, "0");
  const mes = meses[d.getMonth()];
  const ano = d.getFullYear();
  return `${dia} de ${mes} de ${ano}`;
}

function formatDateTime(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const meses = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  const dia = String(d.getDate()).padStart(2, "0");
  const mes = meses[d.getMonth()];
  const ano = d.getFullYear();
  const hora = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${dia} ${mes} ${ano}, às ${hora}h${min}`;
}

function StatusBadge({ status }) {
  const norm = (status || "").toLowerCase();
  let cls = "badge-disponivel";
  let txt = "Disponível";
  if (norm === "reservado" || norm === "ativa") {
    cls = "badge-reservado";
    txt = "Reservado";
  } else if (norm === "concluido" || norm === "confirmada") {
    cls = "badge-concluido";
    txt = "Concluído";
  } else if (norm === "cancelado" || norm === "cancelada" || norm === "expirada") {
    cls = "badge-cancelado";
    txt = "Cancelado";
  }
  return <span className={`badge ${cls}`}>{txt}</span>;
}

function Message({ message, type = "error" }) {
  return message ? <div className={`message ${type}`}>{message}</div> : null;
}

/* ==========================================================
   TELA UNIVERSAL DE LOGIN (FIGMA PAGE 1)
   ========================================================== */
function Login({ onLogin }) {
  const [email, setEmail] = useState("ana.ribeiro@aluno.edu.br");
  const [senha, setSenha] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const result = await api("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, senha })
      });
      localStorage.setItem("brecho_token", result.token);
      onLogin(result.aluno);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-screen">
      <div className="login-split-container">
        <div className="login-brand-side">
          <div className="login-brand-logo">
            Brechó Estudantil
            <span>De estudante para estudante.</span>
          </div>

          <h1 className="login-brand-slogan">
            O que você não usa pode fazer parte de outra história.
          </h1>

          <p style={{ fontSize: "14px", color: "var(--text-muted)", lineHeight: "1.5" }}>
            Anuncie, encontre e dê um novo uso a itens da vida estudantil. Simples, perto e entre alunos.
          </p>

          <div className="login-brand-features">
            <div className="feature-pill">
              <strong>Anuncie</strong>
              <span>Publique e acompanhe seus itens.</span>
            </div>
            <div className="feature-pill">
              <strong>Encontre</strong>
              <span>Busque o que você precisa e reserve.</span>
            </div>
            <div className="feature-pill">
              <strong>Combine presencialmente</strong>
              <span>A negociação acontece entre estudantes.</span>
            </div>
          </div>
        </div>

        <div className="login-form-side">
          <div className="login-form-header">
            <span className="sub-header">Bem-vindo ao seu brechó</span>
            <h2>Entre para começar</h2>
            <p style={{ fontSize: "14px", color: "var(--text-muted)", marginTop: "4px" }}>
              Entre com sua conta estudantil.
            </p>
          </div>

          <div className="alert-banner">
            <div className="alert-title">Acesse sua conta estudantil</div>
            <div className="alert-desc">
              Você pode mudar entre anunciante e interessado depois de entrar no app com o botão "Mudar cargo".
            </div>
          </div>

          <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div className="form-group">
              <label className="form-label">E-mail estudantil</label>
              <input
                className="input-control"
                type="email"
                placeholder="exemplo@aluno.edu.br"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Senha</label>
              <input
                className="input-control"
                type="password"
                placeholder="••••••••••••"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
              />
            </div>

            <Message message={error} />

            <button type="submit" className="btn btn-primary" style={{ height: "46px", marginTop: "8px" }} disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

/* ==========================================================
   VISÃO DO ANUNCIANTE - MINHA LOJA (FIGMA PAGE 1)
   ========================================================== */
function SellerDashboard({ aluno, onNavigate, onEditAnnouncement }) {
  const [anuncios, setAnuncios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("TODOS");
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [estFilter, setEstFilter] = useState("");

  async function loadData() {
    setLoading(true);
    try {
      const res = await api("/me/anuncios");
      setAnuncios(res.dados || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const metricDisponiveis = anuncios.filter(a => a.status === "DISPONIVEL").length;
  const metricReservados = anuncios.filter(a => a.status === "RESERVADO").length;
  const metricConcluidos = anuncios.filter(a => a.status === "CONCLUIDO").length;
  const totalAtivos = metricDisponiveis + metricReservados;

  const filtered = useMemo(() => {
    return anuncios.filter(a => {
      if (statusFilter !== "TODOS" && a.status !== statusFilter) return false;
      if (search && !a.item.toLowerCase().includes(search.toLowerCase())) return false;
      if (catFilter && a.categoria !== catFilter) return false;
      if (estFilter && a.estadoConservacao !== estFilter) return false;
      return true;
    });
  }, [anuncios, statusFilter, search, catFilter, estFilter]);

  const cardsView = filtered.filter(a => a.status !== "CANCELADO");
  const canceladosView = filtered.filter(a => a.status === "CANCELADO");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Minha loja</h1>
          <p className="page-subtitle">Olá, {aluno.nome}. Gerencie seus anúncios e acompanhe o interesse dos alunos.</p>
        </div>
        <button className="btn btn-primary" onClick={() => onNavigate("cadastro")}>
          + Novo anúncio
        </button>
      </div>

      <div className="metrics-row">
        <div className="metric-card">
          <div className="metric-card-header">
            <span className="metric-number">{metricDisponiveis}</span>
            <span className="metric-label">Disponíveis</span>
          </div>
          <div className="metric-sub">Prontos para uma nova história.</div>
        </div>

        <div className="metric-card">
          <div className="metric-card-header">
            <span className="metric-number">{metricReservados}</span>
            <span className="metric-label">Reservado</span>
          </div>
          <div className="metric-sub">Uma negociação aguarda você.</div>
        </div>

        <div className="metric-card">
          <div className="metric-card-header">
            <span className="metric-number">{metricConcluidos}</span>
            <span className="metric-label">Concluído</span>
          </div>
          <div className="metric-sub">Guardado no seu histórico.</div>
        </div>
      </div>

      <div className="active-limit-caption">
        <strong>{totalAtivos} de 5 anúncios ativos</strong>
        <span>Disponíveis + reservados contam no limite. Você ainda pode publicar {Math.max(0, 5 - totalAtivos)} itens.</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "12px" }}>
        <h2 style={{ fontSize: "18px", fontWeight: "700", color: "var(--primary-dark)" }}>Seus anúncios</h2>

        <div className="filters-bar">
          <div className="search-input-wrap">
            <input
              type="text"
              className="input-control"
              placeholder="Buscar anúncio..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select className="select-control" value={catFilter} onChange={(e) => setCatFilter(e.target.value)}>
            <option value="">Categoria ↓</option>
            {CATEGORIAS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          <select className="select-control" value={estFilter} onChange={(e) => setEstFilter(e.target.value)}>
            <option value="">Conservação ↓</option>
            {ESTADOS.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
          </select>
        </div>

        <div className="tabs-filter">
          <button className={`tab-btn ${statusFilter === "TODOS" ? "active" : ""}`} onClick={() => setStatusFilter("TODOS")}>
            Todos · {anuncios.length}
          </button>
          <button className={`tab-btn ${statusFilter === "DISPONIVEL" ? "active" : ""}`} onClick={() => setStatusFilter("DISPONIVEL")}>
            Disponível · {metricDisponiveis}
          </button>
          <button className={`tab-btn ${statusFilter === "RESERVADO" ? "active" : ""}`} onClick={() => setStatusFilter("RESERVADO")}>
            Reservado · {metricReservados}
          </button>
          <button className={`tab-btn ${statusFilter === "CONCLUIDO" ? "active" : ""}`} onClick={() => setStatusFilter("CONCLUIDO")}>
            Concluído · {metricConcluidos}
          </button>
          <button className={`tab-btn ${statusFilter === "CANCELADO" ? "active" : ""}`} onClick={() => setStatusFilter("CANCELADO")}>
            Cancelado · {anuncios.filter(a => a.status === "CANCELADO").length}
          </button>
        </div>

        <Message message={error} />

        {loading ? (
          <p style={{ color: "var(--text-muted)" }}>Carregando seus anúncios...</p>
        ) : filtered.length === 0 ? (
          <div className="alert-banner">
            <div className="alert-title">Nenhum anúncio encontrado</div>
            <div className="alert-desc">Nenhum item corresponde aos filtros selecionados.</div>
          </div>
        ) : (
          <>
            <div className="catalog-grid">
              {cardsView.map((item) => (
                <div key={item.id} className="item-card">
                  <div className="item-card-top">
                    <div className="item-card-meta">
                      <span className="item-category-tag">{formatLabel(item.categoria)} · {formatLabel(item.estadoConservacao)}</span>
                      <StatusBadge status={item.status} />
                    </div>
                    <div className="item-title">{item.item}</div>
                    <div className="item-price">{item.precoExibicao}</div>
                    <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
                      Publicado em {formatDate(item.criadoEm)}
                    </div>
                  </div>

                  <div className="item-card-actions">
                    {item.status === "DISPONIVEL" && (
                      <button className="btn btn-secondary" onClick={() => onEditAnnouncement(item)}>
                        Editar anúncio
                      </button>
                    )}
                    {item.status === "RESERVADO" && (
                      <button className="btn btn-secondary" onClick={() => onNavigate("gerenciamento")}>
                        Gerenciar reserva
                      </button>
                    )}
                    {item.status === "CONCLUIDO" && (
                      <button className="btn btn-secondary" onClick={() => onNavigate("historico")}>
                        Ver histórico
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {canceladosView.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "16px" }}>
                <span style={{ fontSize: "14px", fontWeight: "600", color: "var(--text-muted)" }}>Itens cancelados</span>
                {canceladosView.map(item => (
                  <div key={item.id} className="item-row-card">
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <StatusBadge status={item.status} />
                      <strong style={{ fontSize: "15px" }}>{item.item}</strong>
                    </div>
                    <div style={{ fontSize: "14px", color: "var(--text-muted)" }}>
                      {item.precoExibicao} · {formatDate(item.criadoEm)}
                    </div>
                    <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>Sem reserva ativa</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* ==========================================================
   CATÁLOGO BRECHÓ - COMPARTILHADO (FIGMA PAGE 2 & 4)
   ========================================================== */
function Catalog({ aluno, isAnunciante, onSelectItem }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("");
  const [est, setEst] = useState("");

  async function loadItems() {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (search) params.append("busca", search);
      if (cat) params.append("categoria", cat);
      if (est) params.append("estado", est);
      const res = await api("/anuncios?" + params.toString());
      setItems(res.dados || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadItems();
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Brechó</h1>
          <p className="page-subtitle">
            {isAnunciante
              ? "Conheça os itens de outros estudantes, prontos para um novo uso."
              : "Itens de outros estudantes, prontos para um novo uso. Explore e reserve o que precisar."}
          </p>
        </div>
      </div>

      {isAnunciante && (
        <div className="alert-banner">
          <div className="alert-title">Você está no perfil anunciante.</div>
          <div className="alert-desc">
            Aqui você pode apenas consultar. Para reservar, troque para o perfil interessado no botão "Mudar cargo". Anúncios de outros alunos não podem ser editados.
          </div>
        </div>
      )}

      <form
        className="filters-bar"
        onSubmit={(e) => {
          e.preventDefault();
          loadItems();
        }}
      >
        <div className="search-input-wrap">
          <input
            className="input-control"
            placeholder="Buscar por nome ou descrição do item"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="select-control" value={cat} onChange={(e) => setCat(e.target.value)}>
          <option value="">Todas as categorias</option>
          {CATEGORIAS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <select className="select-control" value={est} onChange={(e) => setEst(e.target.value)}>
          <option value="">Todas conservações</option>
          {ESTADOS.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
        </select>
        <button type="submit" className="btn btn-primary">
          Buscar
        </button>
      </form>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "14px", color: "var(--text-muted)" }}>
        <strong>{items.length} itens disponíveis</strong>
        <span>Negociação presencial entre estudantes</span>
      </div>

      <Message message={error} />

      {loading ? (
        <p style={{ color: "var(--text-muted)" }}>Carregando itens...</p>
      ) : items.length === 0 ? (
        <div className="alert-banner">
          <div className="alert-title">Nenhum anúncio disponível</div>
          <div className="alert-desc">Não há itens disponíveis no momento para os critérios buscados.</div>
        </div>
      ) : (
        <div className="catalog-grid">
          {items.map((item) => (
            <div key={item.id} className="item-card">
              <div className="item-card-top">
                <div className="item-card-meta">
                  <span className="item-category-tag">{formatLabel(item.categoria)} · {formatLabel(item.estadoConservacao)}</span>
                  <StatusBadge status={item.status} />
                </div>
                <div className="item-title">{item.item}</div>
                <div className="item-desc">{item.descricao}</div>
                <div className="item-price">{item.precoExibicao}</div>
              </div>

              <div className="item-card-bottom">
                <span>{item.anunciante?.nome || "Estudante"}</span>
                {isAnunciante ? (
                  <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Somente consulta</span>
                ) : (
                  <button
                    className="btn btn-secondary"
                    style={{ padding: "6px 12px", fontSize: "13px" }}
                    onClick={() => onSelectItem(item)}
                  >
                    Ver detalhes →
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ==========================================================
   DETALHES DO ITEM & RESERVA (ALUNO INTERESSADO)
   ========================================================== */
function ItemDetail({ item, aluno, onBack, onReserved }) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const isOwn = item.anunciante?.id === aluno.id;

  async function handleReserve() {
    setLoading(true);
    setError("");
    try {
      await api(`/anuncios/${item.id}/reservas`, { method: "POST" });
      onReserved();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <button className="btn btn-secondary" style={{ alignSelf: "flex-start" }} onClick={onBack}>
        ← Voltar ao Brechó
      </button>

      <div className="form-layout">
        <div className="form-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className="item-category-tag">{formatLabel(item.categoria)} · {formatLabel(item.estadoConservacao)}</span>
            <StatusBadge status={item.status} />
          </div>

          <h1 className="page-title" style={{ fontSize: "28px" }}>{item.item}</h1>
          <div className="item-price" style={{ fontSize: "26px" }}>{item.precoExibicao}</div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <strong style={{ fontSize: "14px", color: "var(--primary-dark)" }}>Descrição do item</strong>
            <p style={{ fontSize: "15px", color: "var(--text-muted)", lineHeight: "1.6" }}>{item.descricao}</p>
          </div>

          <div style={{ borderTop: "1px solid var(--border-light)", paddingTop: "16px", display: "flex", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Anunciante</div>
              <strong style={{ fontSize: "15px", color: "var(--primary-dark)" }}>{item.anunciante?.nome}</strong>
            </div>
            <div>
              <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Publicado em</div>
              <strong style={{ fontSize: "15px", color: "var(--primary-dark)" }}>{formatDate(item.criadoEm)}</strong>
            </div>
          </div>

          <Message message={error} />

          {item.status === "DISPONIVEL" && !isOwn && (
            <button className="btn btn-primary" style={{ height: "46px" }} onClick={handleReserve} disabled={loading}>
              {loading ? "Reservando..." : "Reservar item"}
            </button>
          )}

          {isOwn && (
            <div className="alert-banner">
              <div className="alert-title">Seu próprio anúncio</div>
              <div className="alert-desc">Você não pode reservar itens que você mesmo anunciou.</div>
            </div>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div className="side-panel-card support-bg">
            <div className="side-panel-title">Como funciona a reserva?</div>
            <div className="side-panel-desc">
              1. Você manifesta o interesse clicando em "Reservar item".<br/><br/>
              2. O anúncio fica reservado exclusivamente para você por até 3 dias.<br/><br/>
              3. Vocês combinam presencialmente na escola para realizar a entrega e pagamento/troca.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ==========================================================
   CADASTRO / EDIÇÃO DE ANÚNCIO (FIGMA PAGE 2)
   ========================================================== */
function AnnouncementForm({ editing, aluno, onDone, onCancel }) {
  const initial = editing ? {
    item: editing.item || "",
    descricao: editing.descricao || "",
    categoria: editing.categoria || "LIVRO",
    estadoConservacao: editing.estadoConservacao || "BOM",
    preco: editing.preco !== null && editing.preco !== undefined ? editing.preco : ""
  } : {
    item: "",
    descricao: "",
    categoria: "MATERIAL_ESCOLAR",
    estadoConservacao: "NOVO",
    preco: ""
  };

  const [form, setForm] = useState(initial);
  const [activeCount, setActiveCount] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api("/me/anuncios").then(res => {
      const ativos = (res.dados || []).filter(a => ["DISPONIVEL", "RESERVADO"].includes(a.status)).length;
      setActiveCount(ativos);
    }).catch(() => {});
  }, []);

  function field(name, value) {
    setForm(prev => ({ ...prev, [name]: value }));
  }

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const payload = {
        item: form.item,
        descricao: form.descricao,
        categoria: form.categoria,
        estadoConservacao: form.estadoConservacao,
        preco: form.preco === "" ? null : Number(form.preco)
      };

      if (editing) {
        await api(`/anuncios/${editing.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload)
        });
      } else {
        await api("/anuncios", {
          method: "POST",
          body: JSON.stringify(payload)
        });
      }
      onDone();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const isTroca = form.preco === "" || Number(form.preco) === 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">{editing ? "Editar anúncio" : "Novo anúncio"}</h1>
          <p className="page-subtitle">Preencha as informações do item. Um bom texto ajuda quem está procurando.</p>
        </div>
        <button className="btn btn-secondary" onClick={onCancel}>
          Voltar à loja
        </button>
      </div>

      <div className="form-layout">
        <form onSubmit={submit} className="form-card">
          <div className="form-group">
            <label className="form-label">Nome do item *</label>
            <input
              className="input-control"
              placeholder="Ex: Caderno universitário 10 matérias"
              value={form.item}
              onChange={(e) => field("item", e.target.value)}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Categoria *</label>
              <select
                className="select-control"
                style={{ width: "100%" }}
                value={form.categoria}
                onChange={(e) => field("categoria", e.target.value)}
              >
                {CATEGORIAS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Conservação *</label>
              <select
                className="select-control"
                style={{ width: "100%" }}
                value={form.estadoConservacao}
                onChange={(e) => field("estadoConservacao", e.target.value)}
              >
                {ESTADOS.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Preço (R$) <span>opcional</span></label>
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <input
                className="input-control"
                type="number"
                step="0.01"
                min="0"
                placeholder="12,00"
                value={form.preco}
                onChange={(e) => field("preco", e.target.value)}
              />
              <span className={`badge ${isTroca ? "badge-disponivel" : "badge-gray"}`} style={{ padding: "8px 16px" }}>
                {isTroca ? "Valor zero = Troca" : `R$ ${Number(form.preco).toFixed(2).replace(".", ",")}`}
              </span>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Descrição *</label>
            <textarea
              className="input-control"
              rows={4}
              placeholder="Descreva detalhes como tamanho, edição, marca e condições do item..."
              value={form.descricao}
              onChange={(e) => field("descricao", e.target.value)}
              required
            />
          </div>

          <Message message={error} />

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "12px" }}>
            <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>* Campos obrigatórios</span>
            <div style={{ display: "flex", gap: "12px" }}>
              <button type="button" className="btn btn-secondary" onClick={onCancel}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? "Salvando..." : "Publicar anúncio"}
              </button>
            </div>
          </div>
        </form>

        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div className="side-panel-card support-bg">
            <span className="badge badge-disponivel" style={{ alignSelf: "flex-start" }}>
              {activeCount} de 5 ativos
            </span>
            <div className="side-panel-title">Há espaço para seu item.</div>
            <div className="side-panel-desc">
              Você pode manter até 5 anúncios ativos, entre disponíveis e reservados.<br/><br/>
              Ao publicar, este anúncio ficará Disponível e você terá {activeCount + 1} de 5 anúncios ativos.
            </div>
          </div>

          <div className="side-panel-card">
            <div className="side-panel-title">Informações simples e claras</div>
            <div className="side-panel-desc">
              <strong>Categorias</strong><br/>
              Uniforme, Material escolar, Livro, Eletrônico ou Outro.<br/><br/>
              <strong>Conservação</strong><br/>
              Novo, Bom ou Usado.<br/><br/>
              Sem preço ou com valor zero, o anúncio será exibido como "Troca".
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ==========================================================
   GERENCIAMENTO DE RESERVAS - ANUNCIANTE (FIGMA PAGE 3)
   ========================================================== */
function SellerReservations({ onNavigate }) {
  const [reservas, setReservas] = useState([]);
  const [tab, setTab] = useState("PENDENTES");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadData() {
    setLoading(true);
    try {
      const res = await api("/me/reservas-recebidas");
      setReservas(res.dados || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleConfirm(id) {
    if (!confirm("Confirmar que a entrega/negociação foi realizada?")) return;
    setError("");
    setSuccess("");
    try {
      await api(`/reservas/${id}/confirmacao`, { method: "PATCH" });
      setSuccess("Negociação confirmada com sucesso!");
      loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleCancel(id) {
    if (!confirm("Cancelar esta reserva e liberar o item novamente?")) return;
    setError("");
    setSuccess("");
    try {
      await api(`/reservas/${id}/cancelamento`, { method: "PATCH" });
      setSuccess("Reserva cancelada. O anúncio voltou a ficar disponível.");
      loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  const ativas = reservas.filter(r => r.status === "ATIVA");
  const concluidas = reservas.filter(r => r.status === "CONFIRMADA");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Gerenciamento</h1>
          <p className="page-subtitle">Acompanhe os pedidos e confirme as negociações dos seus anúncios.</p>
        </div>
        <button className="btn btn-secondary" onClick={() => onNavigate("historico")}>
          Ver histórico
        </button>
      </div>

      <div className="tabs-filter">
        <button className={`tab-btn ${tab === "PENDENTES" ? "active" : ""}`} onClick={() => setTab("PENDENTES")}>
          Pendentes · {ativas.length}
        </button>
        <button className={`tab-btn ${tab === "CONCLUIDAS" ? "active" : ""}`} onClick={() => setTab("CONCLUIDAS")}>
          Concluídos · {concluidas.length}
        </button>
      </div>

      <Message message={error} />
      <Message message={success} type="success" />

      {loading ? (
        <p style={{ color: "var(--text-muted)" }}>Carregando reservas...</p>
      ) : tab === "PENDENTES" && ativas.length === 0 ? (
        <div className="alert-banner">
          <div className="alert-title">Nenhuma reserva pendente</div>
          <div className="alert-desc">Nenhum aluno solicitou reserva para seus anúncios no momento.</div>
        </div>
      ) : tab === "CONCLUIDAS" && concluidas.length === 0 ? (
        <div className="alert-banner">
          <div className="alert-title">Nenhuma negociação concluída ainda</div>
          <div className="alert-desc">As reservas confirmadas por você aparecerão aqui e no histórico.</div>
        </div>
      ) : (
        <div className="reservation-manage-layout">
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {(tab === "PENDENTES" ? ativas : concluidas).map((res) => (
              <div key={res.id} className="reservation-order-card">
                <div className="res-header-tag">
                  <span>RESERVA RECEBIDA · {formatDate(res.reservadoEm)}</span>
                  <StatusBadge status={res.status} />
                </div>

                <div>
                  <span className="item-category-tag">
                    {formatLabel(res.anuncio?.categoria)} · {formatLabel(res.anuncio?.estadoConservacao)}
                  </span>
                  <h2 style={{ fontSize: "22px", fontWeight: "700", color: "var(--primary-dark)", marginTop: "4px" }}>
                    {res.anuncio?.item}
                  </h2>
                  <div className="item-price" style={{ marginTop: "6px" }}>{res.anuncio?.precoExibicao}</div>
                </div>

                <div className="res-student-info">
                  <div>
                    <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Aluno interessado</div>
                    <strong style={{ fontSize: "15px", color: "var(--primary-dark)" }}>
                      {res.interessado?.nome || "Aluno"}
                    </strong>
                    <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>{res.interessado?.email}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Solicitada em</div>
                    <strong style={{ fontSize: "14px", color: "var(--primary-dark)" }}>
                      {formatDateTime(res.reservadoEm)}
                    </strong>
                  </div>
                </div>

                {res.status === "ATIVA" && (
                  <>
                    <div className="alert-banner">
                      <div className="alert-title">Confirme até {formatDateTime(res.expiraEm)}</div>
                      <div className="alert-desc">
                        Sem sua confirmação em 3 dias, a reserva expira automaticamente e o item volta a ficar Disponível.
                      </div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <strong style={{ fontSize: "14px", color: "var(--primary-dark)" }}>A negociação já aconteceu?</strong>
                      <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                        Ao confirmar, o anúncio passa para Concluído e permanece no histórico, somente para consulta. Essa etapa não pode ser desfeita.
                      </p>
                    </div>

                    <div style={{ display: "flex", gap: "12px" }}>
                      <button className="btn btn-primary" onClick={() => handleConfirm(res.id)}>
                        Confirmar negociação
                      </button>
                      <button className="btn btn-outline-danger" onClick={() => handleCancel(res.id)}>
                        Cancelar reserva
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div className="side-panel-card support-bg">
              <div className="side-panel-title">Uma reserva por item.</div>
              <div className="side-panel-desc">
                Enquanto este item está reservado, ele não aceita novas reservas de outros estudantes.
              </div>
            </div>

            <div className="side-panel-card">
              <div className="side-panel-title">O caminho do anúncio</div>
              <div className="side-panel-desc" style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <div>
                  <strong>Disponível</strong><br/>
                  O item pode receber uma reserva.
                </div>
                <div>
                  <strong>Reservado</strong><br/>
                  Você tem 3 dias para confirmar.
                </div>
                <div>
                  <strong>Concluído</strong><br/>
                  Negociação finalizada, só leitura.
                </div>
                <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "8px" }}>
                  Se cancelar a reserva, o item volta a Disponível.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ==========================================================
   HISTÓRICO DE NEGOCIAÇÕES (FIGMA PAGE 3)
   ========================================================== */
function HistoryView({ aluno, onNavigate }) {
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterCat, setFilterCat] = useState("TODOS");

  useEffect(() => {
    setLoading(true);
    api("/me/negociacoes")
      .then(res => {
        const list = res.dados || [];
        setItems(list);
        if (list.length > 0) setSelected(list[0]);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (filterCat === "TODOS") return items;
    return items.filter(i => i.categoria === filterCat);
  }, [items, filterCat]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Histórico de negociações</h1>
          <p className="page-subtitle">Seus itens concluídos ficam aqui. Estes registros são somente para consulta.</p>
        </div>
        <button className="btn btn-secondary" onClick={() => onNavigate("loja")}>
          Voltar à loja
        </button>
      </div>

      <div className="alert-banner">
        <div className="alert-title">Negociação confirmada!</div>
        <div className="alert-desc">
          O histórico arquiva seus itens entregues presencialmente e conclui o ciclo do anúncio.
        </div>
      </div>

      <div className="tabs-filter">
        <button className={`tab-btn ${filterCat === "TODOS" ? "active" : ""}`} onClick={() => setFilterCat("TODOS")}>
          Todos
        </button>
        {CATEGORIAS.map(c => (
          <button
            key={c.value}
            className={`tab-btn ${filterCat === c.value ? "active" : ""}`}
            onClick={() => setFilterCat(c.value)}
          >
            {c.label}
          </button>
        ))}
      </div>

      <Message message={error} />

      {loading ? (
        <p style={{ color: "var(--text-muted)" }}>Carregando histórico...</p>
      ) : items.length === 0 ? (
        <div className="alert-banner">
          <div className="alert-title">Nenhuma negociação concluída</div>
          <div className="alert-desc">Quando você ou o anunciante confirmarem uma reserva, ela aparecerá aqui.</div>
        </div>
      ) : (
        <div className="history-layout">
          <div className="history-list-pane">
            <span style={{ fontSize: "14px", fontWeight: "700", color: "var(--primary-dark)" }}>
              {filtered.length} negociações concluídas
            </span>
            {filtered.map(item => (
              <div
                key={item.id}
                className={`history-item-selectable ${selected?.id === item.id ? "selected" : ""}`}
                onClick={() => setSelected(item)}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <StatusBadge status="CONCLUIDO" />
                  <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>{formatDate(item.concluidoEm)}</span>
                </div>
                <strong style={{ fontSize: "16px", color: "var(--primary-dark)" }}>{item.item}</strong>
                <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                  {formatLabel(item.categoria)} · {formatLabel(item.estadoConservacao)} · {item.precoExibicao}
                </span>
                <span style={{ fontSize: "12px", color: "var(--primary)", fontWeight: "600", marginTop: "4px" }}>
                  {selected?.id === item.id ? "Registro selecionado" : "Consultar registro"}
                </span>
              </div>
            ))}
          </div>

          {selected && (
            <div className="history-detail-pane">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span className="context-badge">REGISTRO DA NEGOCIAÇÃO</span>
                <span className="badge badge-gray">Somente leitura</span>
              </div>

              <div>
                <h2 style={{ fontSize: "24px", fontWeight: "700", color: "var(--primary-dark)" }}>{selected.item}</h2>
                <div style={{ fontSize: "14px", color: "var(--text-muted)", marginTop: "4px" }}>
                  {formatLabel(selected.categoria)} · {formatLabel(selected.estadoConservacao)}
                </div>
                <div className="item-price" style={{ marginTop: "12px", fontSize: "24px" }}>{selected.precoExibicao}</div>
              </div>

              <div className="res-student-info">
                <div>
                  <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Anunciante</div>
                  <strong style={{ fontSize: "15px", color: "var(--primary-dark)" }}>
                    {selected.anunciante?.nome || aluno.nome}
                  </strong>
                </div>
                <div>
                  <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Seu papel</div>
                  <strong style={{ fontSize: "15px", color: "var(--primary-dark)" }}>
                    {selected.papel === "ANUNCIANTE" ? "Anunciante" : "Interessado / Comprador"}
                  </strong>
                </div>
              </div>

              <div className="res-student-info">
                <div>
                  <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Publicado em</div>
                  <strong style={{ fontSize: "14px", color: "var(--primary-dark)" }}>
                    {formatDate(selected.criadoEm)}
                  </strong>
                </div>
                <div>
                  <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Negociação concluída</div>
                  <strong style={{ fontSize: "14px", color: "var(--primary-dark)" }}>
                    {formatDateTime(selected.concluidoEm)}
                  </strong>
                </div>
              </div>

              <div className="side-panel-card support-bg" style={{ padding: "16px" }}>
                <div className="side-panel-title">Uma nova história começou.</div>
                <div className="side-panel-desc">
                  Este anúncio não pode ser editado, removido ou voltar a Disponível. Ele permanece no histórico e não conta no limite de 5 anúncios ativos.
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ==========================================================
   ALUNO INTERESSADO - HOME / MENU (FIGMA PAGE 4)
   ========================================================== */
function BuyerHome({ aluno, onNavigate }) {
  const [minhasReservas, setMinhasReservas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api("/me/reservas")
      .then(res => setMinhasReservas(res.dados || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const ativas = minhasReservas.filter(r => r.status === "ATIVA");
  const concluidas = minhasReservas.filter(r => r.status === "CONFIRMADA");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Olá, {aluno.nome}!</h1>
          <p className="page-subtitle">Encontre o que precisa e acompanhe suas negociações em um só lugar.</p>
        </div>
      </div>

      <div className="side-panel-card support-bg" style={{ padding: "28px", display: "flex", flexDirection: "column", gap: "16px" }}>
        <h2 style={{ fontSize: "20px", fontWeight: "700", color: "var(--primary-dark)" }}>Seu próximo item pode estar aqui.</h2>
        <p style={{ fontSize: "14px", color: "var(--text-muted)" }}>
          Livros, uniformes e materiais de outros estudantes, prontos para um novo uso.
        </p>
        <div>
          <button className="btn btn-primary" onClick={() => onNavigate("brecho")}>
            Explorar o Brechó
          </button>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ fontSize: "18px", fontWeight: "700", color: "var(--primary-dark)" }}>Minhas negociações</h2>
        <button
          className="btn btn-secondary"
          style={{ border: "none", color: "var(--primary)", fontWeight: "600" }}
          onClick={() => onNavigate("minhas-negociacoes")}
        >
          Ver minhas negociações →
        </button>
      </div>

      <div className="metrics-row" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <div className="metric-card">
          <div className="metric-card-header">
            <span className="metric-number">{ativas.length}</span>
            <span className="metric-label">Reserva ativa</span>
            <StatusBadge status="RESERVADO" />
          </div>
          {ativas.length > 0 ? (
            <div style={{ marginTop: "8px" }}>
              <strong style={{ fontSize: "15px", color: "var(--primary-dark)" }}>{ativas[0].anuncio?.item}</strong>
              <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                {ativas[0].anuncio?.autor?.nome} · {ativas[0].anuncio?.precoExibicao}
              </div>
              <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
                Confirmação até {formatDateTime(ativas[0].expiraEm)}
              </div>
            </div>
          ) : (
            <div className="metric-sub">Nenhuma reserva ativa no momento.</div>
          )}
        </div>

        <div className="metric-card">
          <div className="metric-card-header">
            <span className="metric-number">{concluidas.length}</span>
            <span className="metric-label">Negociação concluída</span>
            <StatusBadge status="CONCLUIDO" />
          </div>
          {concluidas.length > 0 ? (
            <div style={{ marginTop: "8px" }}>
              <strong style={{ fontSize: "15px", color: "var(--primary-dark)" }}>{concluidas[0].anuncio?.item}</strong>
              <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                {concluidas[0].anuncio?.autor?.nome} · {concluidas[0].anuncio?.precoExibicao}
              </div>
              <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
                Concluído em {formatDate(concluidas[0].confirmadoEm)}
              </div>
            </div>
          ) : (
            <div className="metric-sub">Nenhuma negociação concluída ainda.</div>
          )}
        </div>
      </div>

      <div className="side-panel-card">
        <div className="side-panel-title">A negociação acontece pessoalmente.</div>
        <div className="side-panel-desc">
          A reserva sinaliza seu interesse. Converse com o anunciante presencialmente para combinar a negociação.<br/>
          Sem confirmação do anunciante em 3 dias, a reserva expira automaticamente e o item volta a Disponível.
        </div>
      </div>
    </div>
  );
}

/* ==========================================================
   ALUNO INTERESSADO - MINHAS NEGOCIAÇÕES (FIGMA PAGE 5)
   ========================================================== */
function BuyerNegotiations() {
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("TODOS");

  useEffect(() => {
    setLoading(true);
    api("/me/reservas")
      .then(res => setReservas(res.dados || []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const ativas = reservas.filter(r => r.status === "ATIVA");
  const historico = reservas.filter(r => r.status !== "ATIVA");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Minhas negociações</h1>
          <p className="page-subtitle">Sua reserva ativa e o histórico de negociações, juntos nesta página.</p>
        </div>
      </div>

      <div className="filters-bar">
        <div className="search-input-wrap">
          <input
            className="input-control"
            placeholder="Buscar por item ou anunciante"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="select-control" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="TODOS">Todos os estados</option>
          <option value="ATIVA">Reservado (Ativa)</option>
          <option value="CONFIRMADA">Concluído</option>
          <option value="CANCELADA">Cancelada / Expirada</option>
        </select>
      </div>

      <Message message={error} />

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontSize: "18px", fontWeight: "700", color: "var(--primary-dark)" }}>Em andamento</h2>
          <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>{ativas.length} reserva ativa</span>
        </div>

        {ativas.length === 0 ? (
          <div className="alert-banner">
            <div className="alert-title">Nenhuma reserva em andamento</div>
            <div className="alert-desc">Explore o Brechó para encontrar itens escolares e fazer uma reserva.</div>
          </div>
        ) : (
          ativas.map(res => (
            <div key={res.id} className="form-card" style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "24px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <h3 style={{ fontSize: "20px", fontWeight: "700", color: "var(--primary-dark)" }}>
                    {res.anuncio?.item}
                  </h3>
                  <StatusBadge status="RESERVADO" />
                </div>
                <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                  {formatLabel(res.anuncio?.categoria)} · {formatLabel(res.anuncio?.estadoConservacao)}
                </div>
                <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                  Anunciado por <strong>{res.anuncio?.autor?.nome}</strong>
                </div>
                <div className="item-price" style={{ marginTop: "8px" }}>{res.anuncio?.precoExibicao}</div>
              </div>

              <div className="side-panel-card support-bg" style={{ padding: "16px" }}>
                <div className="side-panel-title">Aguardando confirmação de {res.anuncio?.autor?.nome}</div>
                <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
                  Reservado em {formatDateTime(res.reservadoEm)}
                </div>
                <div style={{ fontSize: "13px", fontWeight: "700", color: "var(--primary-dark)", marginTop: "8px" }}>
                  Confirmação até {formatDateTime(res.expiraEm)}
                </div>
                <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
                  O anunciante tem 3 dias após a reserva para confirmar a negociação.
                </div>
              </div>
            </div>
          ))
        )}

        <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
          Sem confirmação em 3 dias, a reserva expira automaticamente e o item volta a Disponível. Enquanto estiver Reservado, não aceita novas reservas.
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontSize: "18px", fontWeight: "700", color: "var(--primary-dark)" }}>Histórico</h2>
          <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>{historico.length} negociação · somente leitura</span>
        </div>

        {historico.length === 0 ? (
          <p style={{ fontSize: "14px", color: "var(--text-muted)" }}>Nenhuma negociação anterior no histórico.</p>
        ) : (
          historico.map(res => (
            <div key={res.id} className="item-row-card">
              <div>
                <strong style={{ fontSize: "16px", color: "var(--primary-dark)" }}>{res.anuncio?.item}</strong>
                <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                  {formatLabel(res.anuncio?.categoria)} · {formatLabel(res.anuncio?.estadoConservacao)} · Anunciante: {res.anuncio?.autor?.nome}
                </div>
              </div>
              <div style={{ textAlign: "right", display: "flex", alignItems: "center", gap: "16px" }}>
                <span className="item-price" style={{ fontSize: "16px" }}>{res.anuncio?.precoExibicao}</span>
                <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                  {res.status === "CONFIRMADA" ? `Concluído em ${formatDate(res.confirmadoEm)}` : "Encerrado"}
                </span>
                <StatusBadge status={res.status} />
              </div>
            </div>
          ))
        )}
      </div>

      <div className="side-panel-card support-bg" style={{ padding: "20px" }}>
        <div className="side-panel-title">Negociação presencial entre estudantes</div>
        <div className="side-panel-desc">
          A reserva sinaliza seu interesse. Combine pessoalmente com o anunciante os próximos passos da negociação.
        </div>
      </div>
    </div>
  );
}

/* ==========================================================
   APLICAÇÃO PRINCIPAL COM CONTROLE DE PERFIL (MUDAR CARGO)
   ========================================================== */
export default function App() {
  const [aluno, setAluno] = useState(null);
  // Cargo/Papel ativo: "ANUNCIANTE" ou "INTERESSADO"
  const [role, setRole] = useState(() => localStorage.getItem("brecho_role") || "ANUNCIANTE");
  const [page, setPage] = useState("loja");
  const [selectedItem, setSelectedItem] = useState(null);
  const [editingItem, setEditingItem] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("brecho_token");
    if (token) {
      api("/me")
        .then(res => setAluno(res.aluno))
        .catch(() => {
          localStorage.removeItem("brecho_token");
          setAluno(null);
        });
    }
  }, []);

  function handleRoleToggle() {
    const newRole = role === "ANUNCIANTE" ? "INTERESSADO" : "ANUNCIANTE";
    setRole(newRole);
    localStorage.setItem("brecho_role", newRole);
    setSelectedItem(null);
    setEditingItem(null);
    if (newRole === "ANUNCIANTE") {
      setPage("loja");
    } else {
      setPage("menu");
    }
  }

  function handleLogout() {
    localStorage.removeItem("brecho_token");
    setAluno(null);
  }

  const currentDateText = useMemo(() => {
    const d = new Date();
    const meses = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
    return `${String(d.getDate()).padStart(2, "0")} de ${meses[d.getMonth()]} de ${d.getFullYear()}`;
  }, []);

  if (!aluno) {
    return <Login onLogin={setAluno} />;
  }

  const isAnunciante = role === "ANUNCIANTE";

  return (
    <div className="app-container">
      {/* SIDEBAR COM DESIGN SYSTEM COMPLETO */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="brand-title">Brechó Estudantil</div>
          <div className="brand-sub">De estudante para estudante.</div>
        </div>

        {/* PERFIL E SELETOR DE CARGO */}
        <div className="profile-card">
          <div>
            <div className="profile-name">{aluno.nome}</div>
            <div className="profile-role">
              {isAnunciante ? "Aluno anunciante" : "Aluno interessado"}
            </div>
          </div>
          <button className="role-switch-btn" onClick={handleRoleToggle}>
            Mudar cargo ⇄
          </button>
        </div>

        {/* NAVEGAÇÃO CONDICIONAL AO CARGO */}
        <nav className="nav-section">
          <div className="nav-section-title">
            {isAnunciante ? "SEU ESPAÇO" : "SEU ESPAÇO"}
          </div>

          {isAnunciante ? (
            <>
              <button
                className={`nav-item ${page === "loja" && !selectedItem && !editingItem ? "active" : ""}`}
                onClick={() => { setSelectedItem(null); setEditingItem(null); setPage("loja"); }}
              >
                Minha loja
              </button>
              <button
                className={`nav-item ${page === "brecho" && !selectedItem && !editingItem ? "active" : ""}`}
                onClick={() => { setSelectedItem(null); setEditingItem(null); setPage("brecho"); }}
              >
                Brechó
              </button>
              <button
                className={`nav-item ${page === "cadastro" && !editingItem ? "active" : ""}`}
                onClick={() => { setSelectedItem(null); setEditingItem(null); setPage("cadastro"); }}
              >
                Cadastro
              </button>
              <button
                className={`nav-item ${page === "gerenciamento" ? "active" : ""}`}
                onClick={() => { setSelectedItem(null); setEditingItem(null); setPage("gerenciamento"); }}
              >
                Gerenciamento
              </button>
              <button
                className={`nav-item ${page === "historico" ? "active" : ""}`}
                onClick={() => { setSelectedItem(null); setEditingItem(null); setPage("historico"); }}
              >
                Histórico
              </button>
            </>
          ) : (
            <>
              <button
                className={`nav-item ${page === "menu" && !selectedItem ? "active" : ""}`}
                onClick={() => { setSelectedItem(null); setEditingItem(null); setPage("menu"); }}
              >
                Menu
              </button>
              <button
                className={`nav-item ${page === "brecho" && !selectedItem ? "active" : ""}`}
                onClick={() => { setSelectedItem(null); setEditingItem(null); setPage("brecho"); }}
              >
                Brechó
              </button>
              <button
                className={`nav-item ${page === "minhas-negociacoes" ? "active" : ""}`}
                onClick={() => { setSelectedItem(null); setEditingItem(null); setPage("minhas-negociacoes"); }}
              >
                Minhas negociações
              </button>
            </>
          )}
        </nav>

        {/* RODAPÉ DA SIDEBAR */}
        <div className="sidebar-footer">
          <div>
            <div className="footer-text-title">Um novo uso começa aqui.</div>
            <div className="footer-text-desc">Negocie presencialmente com outros estudantes.</div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            Sair da conta
          </button>
        </div>
      </aside>

      {/* ÁREA PRINCIPAL */}
      <main className="main-content">
        <header className="top-header">
          <span className="context-badge">
            {isAnunciante ? (
              page === "loja" ? "MINHA LOJA · ESPAÇO DO ANUNCIANTE" :
              page === "brecho" ? "BRECHÓ · ESPAÇO DO ANUNCIANTE" :
              page === "cadastro" ? "ESPAÇO DO ANUNCIANTE" :
              page === "gerenciamento" ? "ESPAÇO DO ANUNCIANTE" : "ESPAÇO DO ANUNCIANTE"
            ) : "ESPAÇO DO INTERESSADO"}
          </span>
          <span className="header-date">{currentDateText}</span>
        </header>

        <div className="content-body">
          {/* RENDERIZAÇÃO DO CONTEÚDO BASEADO NO CARGO E ESTADO */}
          {selectedItem ? (
            <ItemDetail
              item={selectedItem}
              aluno={aluno}
              onBack={() => setSelectedItem(null)}
              onReserved={() => {
                setSelectedItem(null);
                setPage(isAnunciante ? "loja" : "minhas-negociacoes");
              }}
            />
          ) : editingItem ? (
            <AnnouncementForm
              editing={editingItem}
              aluno={aluno}
              onDone={() => {
                setEditingItem(null);
                setPage("loja");
              }}
              onCancel={() => setEditingItem(null)}
            />
          ) : isAnunciante ? (
            <>
              {page === "loja" && (
                <SellerDashboard
                  aluno={aluno}
                  onNavigate={setPage}
                  onEditAnnouncement={setEditingItem}
                />
              )}
              {page === "brecho" && (
                <Catalog
                  aluno={aluno}
                  isAnunciante={true}
                  onSelectItem={setSelectedItem}
                />
              )}
              {page === "cadastro" && (
                <AnnouncementForm
                  aluno={aluno}
                  onDone={() => setPage("loja")}
                  onCancel={() => setPage("loja")}
                />
              )}
              {page === "gerenciamento" && (
                <SellerReservations onNavigate={setPage} />
              )}
              {page === "historico" && (
                <HistoryView aluno={aluno} onNavigate={setPage} />
              )}
            </>
          ) : (
            <>
              {page === "menu" && (
                <BuyerHome aluno={aluno} onNavigate={setPage} />
              )}
              {page === "brecho" && (
                <Catalog
                  aluno={aluno}
                  isAnunciante={false}
                  onSelectItem={setSelectedItem}
                />
              )}
              {page === "minhas-negociacoes" && (
                <BuyerNegotiations />
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

import { useEffect, useRef, useMemo, useState } from "react";
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

/* Avatar de perfil — exibe foto ou iniciais */
function Avatar({ nome, fotoPerfil, size = 48 }) {
  const initials = (nome || "?").split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
  if (fotoPerfil) {
    return (
      <img
        src={"/uploads/perfis/" + fotoPerfil}
        alt={nome}
        style={{
          width: size, height: size, borderRadius: "50%",
          objectFit: "cover", border: "2px solid var(--border-light)", flexShrink: 0
        }}
      />
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: "var(--primary)", color: "#fff",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.36, fontWeight: 700, flexShrink: 0,
      border: "2px solid var(--border-light)"
    }}>
      {initials}
    </div>
  );
}

/* Componente de Estrelas */
function StarRating({ value = 0, onChange, readOnly = true }) {
  return (
    <div className="stars-row">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={`star-icon ${star <= Math.round(value) ? "filled" : ""} ${!readOnly ? "interactive" : ""}`}
          onClick={() => !readOnly && onChange?.(star)}
          title={`${star} estrela${star > 1 ? "s" : ""}`}
        >
          ★
        </span>
      ))}
      {readOnly && (
        <span style={{ fontSize: "13px", fontWeight: "600", color: "var(--primary-dark)", marginLeft: "4px" }}>
          {value > 0 ? Number(value).toFixed(1) : "Sem avaliações"}
        </span>
      )}
    </div>
  );
}

/* Componente de Carrossel de Fotos do Anúncio */
function ImageCarousel({ fotos = [], itemNome = "Produto", height = 260 }) {
  const [index, setIndex] = useState(0);
  const images = Array.isArray(fotos) && fotos.length > 0 ? fotos : [];

  if (images.length === 0) {
    return (
      <div style={{
        width: "100%", height, borderRadius: "12px",
        backgroundColor: "#f0f4f2", display: "flex", alignItems: "center", justifyContent: "center",
        color: "var(--text-muted)", fontSize: "14px"
      }}>
        Sem foto
      </div>
    );
  }

  function prev() {
    setIndex((prevIndex) => (prevIndex === 0 ? images.length - 1 : prevIndex - 1));
  }

  function next() {
    setIndex((prevIndex) => (prevIndex === images.length - 1 ? 0 : prevIndex + 1));
  }

  return (
    <div>
      <div className="carousel-wrap" style={{ height }}>
        <img
          src={`/uploads/anuncios/${images[index]}`}
          alt={`${itemNome} (${index + 1})`}
          className="carousel-slide-img"
          style={{ height }}
        />

        {images.length > 1 && (
          <>
            <button type="button" className="carousel-nav-btn carousel-nav-prev" onClick={prev}>
              ‹
            </button>
            <button type="button" className="carousel-nav-btn carousel-nav-next" onClick={next}>
              ›
            </button>
            <div className="carousel-indicators">
              {images.map((_, i) => (
                <span
                  key={i}
                  className={`carousel-dot ${i === index ? "active" : ""}`}
                  onClick={() => setIndex(i)}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div className="carousel-thumbnails">
          {images.map((img, i) => (
            <img
              key={i}
              src={`/uploads/anuncios/${img}`}
              alt={`Miniatura ${i + 1}`}
              className={`carousel-thumb ${i === index ? "active" : ""}`}
              onClick={() => setIndex(i)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ==========================================================
   TELA UNIVERSAL DE LOGIN (FIGMA PAGE 1)
   ========================================================== */
function Login({ onLogin }) {
  const [email, setEmail] = useState("ana@escola.local");
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
                    {item.fotoUrl && (
                      <img
                        src={`/uploads/anuncios/${item.fotoUrl}`}
                        alt={item.item}
                        className="item-card-image"
                      />
                    )}
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
                {item.fotoUrl && (
                  <img
                    src={`/uploads/anuncios/${item.fotoUrl}`}
                    alt={item.item}
                    className="item-card-image"
                  />
                )}
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
   DETALHES DO ITEM & PEDIDO DE INTERESSE
   ========================================================== */
function ItemDetail({ item, aluno, onBack, onReserved }) {
  const [mensagem, setMensagem] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [anuncianteAvaliacoes, setAnuncianteAvaliacoes] = useState({ media: 0, total: 0 });
  const isOwn = item.anunciante?.id === aluno.id;

  useEffect(() => {
    if (item.anunciante?.id) {
      api(`/alunos/${item.anunciante.id}/avaliacoes/resumo`)
        .then(setAnuncianteAvaliacoes)
        .catch(() => {});
    }
  }, [item]);

  async function handleFazerPedido(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await api(`/anuncios/${item.id}/pedidos`, {
        method: "POST",
        body: JSON.stringify({ mensagem })
      });
      setSuccess("Pedido de interesse enviado ao anunciante com sucesso! O anúncio continua no Brechó e ele analisará os pedidos recebidos.");
      setTimeout(() => {
        onReserved();
      }, 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const fotosCarrossel = Array.isArray(item.fotos) && item.fotos.length > 0
    ? item.fotos
    : (item.fotoUrl ? [item.fotoUrl] : []);

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

          <ImageCarousel fotos={fotosCarrossel} itemNome={item.item} height={280} />

          <h1 className="page-title" style={{ fontSize: "28px" }}>{item.item}</h1>
          <div className="item-price" style={{ fontSize: "26px" }}>{item.precoExibicao}</div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <strong style={{ fontSize: "14px", color: "var(--primary-dark)" }}>Descrição do item</strong>
            <p style={{ fontSize: "15px", color: "var(--text-muted)", lineHeight: "1.6" }}>{item.descricao}</p>
          </div>

          <div style={{ borderTop: "1px solid var(--border-light)", paddingTop: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Avatar nome={item.anunciante?.nome} fotoPerfil={item.anunciante?.fotoPerfil} size={42} />
              <div>
                <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Anunciante</div>
                <strong style={{ fontSize: "15px", color: "var(--primary-dark)" }}>{item.anunciante?.nome}</strong>
                <div>
                  <StarRating value={anuncianteAvaliacoes.media} />
                  <span style={{ fontSize: "12px", color: "var(--text-muted)", marginLeft: "4px" }}>
                    ({anuncianteAvaliacoes.total})
                  </span>
                </div>
              </div>
            </div>
            <div>
              <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Publicado em</div>
              <strong style={{ fontSize: "15px", color: "var(--primary-dark)" }}>{formatDate(item.criadoEm)}</strong>
            </div>
          </div>

          <Message message={error} />
          <Message message={success} type="success" />

          {item.status === "DISPONIVEL" && !isOwn && !success && (
            <form onSubmit={handleFazerPedido} style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "12px" }}>
              <div className="form-group">
                <label className="form-label">Mensagem para o anunciante <span>(opcional)</span></label>
                <input
                  type="text"
                  className="input-control"
                  placeholder="Ex: Olá, tenho interesse! Posso pegar no intervalo de amanhã."
                  value={mensagem}
                  onChange={(e) => setMensagem(e.target.value)}
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ height: "46px" }} disabled={loading}>
                {loading ? "Enviando interesse..." : "Fazer pedido de interesse"}
              </button>
            </form>
          )}

          {isOwn && (
            <div className="alert-banner">
              <div className="alert-title">Seu próprio anúncio</div>
              <div className="alert-desc">Você é o anunciante deste item. Acompanhe os pedidos recebidos em Gerenciamento.</div>
            </div>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div className="side-panel-card support-bg">
            <div className="side-panel-title">Como funcionam os pedidos?</div>
            <div className="side-panel-desc">
              1. Vários estudantes podem pedir o mesmo item ao mesmo tempo sem bloqueá-lo.<br/><br/>
              2. O anúncio não sai do Brechó até que a negociação seja aceita e concluída.<br/><br/>
              3. O anunciante analisa os pedidos recebidos e escolhe com quem concluir presencialmente na escola.
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
  const [fotos, setFotos] = useState([]);
  const [previews, setPreviews] = useState(
    Array.isArray(editing?.fotos) && editing.fotos.length > 0
      ? editing.fotos.map(f => `/uploads/anuncios/${f}`)
      : (editing?.fotoUrl ? [`/uploads/anuncios/${editing.fotoUrl}`] : [])
  );
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

  function handleFilesChange(e) {
    const fileList = Array.from(e.target.files || []).slice(0, 5);
    if (fileList.length > 0) {
      setFotos(fileList);
      setPreviews(fileList.map(f => URL.createObjectURL(f)));
    }
  }

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("item", form.item);
      formData.append("descricao", form.descricao);
      formData.append("categoria", form.categoria);
      formData.append("estadoConservacao", form.estadoConservacao);
      if (form.preco !== "" && form.preco !== null) {
        formData.append("preco", String(Number(form.preco)));
      }
      if (fotos.length > 0) {
        fotos.forEach(f => {
          formData.append("fotos", f);
        });
      }

      if (editing) {
        await api(`/anuncios/${editing.id}`, {
          method: "PATCH",
          body: formData
        });
      } else {
        await api("/anuncios", {
          method: "POST",
          body: formData
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

          <div className="form-group">
            <label className="form-label">Fotos do item <span>(Carrossel de até 5 fotos, a 1ª será a capa)</span></label>
            {previews.length > 0 && (
              <div style={{ display: "flex", gap: "8px", overflowX: "auto", marginBottom: "8px" }}>
                {previews.map((src, i) => (
                  <div key={i} style={{ position: "relative" }}>
                    <img
                      src={src}
                      alt={`Prévia ${i + 1}`}
                      style={{ width: "80px", height: "80px", objectFit: "cover", borderRadius: "8px", border: i === 0 ? "2px solid var(--primary)" : "1px solid var(--border-light)" }}
                    />
                    {i === 0 && (
                      <span style={{ position: "absolute", bottom: "4px", left: "4px", background: "var(--primary)", color: "#fff", fontSize: "10px", padding: "1px 4px", borderRadius: "4px" }}>
                        Capa
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
            <input
              type="file"
              multiple
              accept="image/png, image/jpeg, image/webp"
              onChange={handleFilesChange}
              className="input-control"
              style={{ padding: "8px" }}
            />
            <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
              Selecione de 1 a 5 fotos. A primeira foto adicionada será a capa no catálogo e todas poderão ser navegadas no carrossel.
            </span>
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
   GERENCIAMENTO DE PEDIDOS DE INTERESSE - ANUNCIANTE
   ========================================================== */
function SellerReservations({ onNavigate }) {
  const [pedidos, setPedidos] = useState([]);
  const [tab, setTab] = useState("PENDENTES");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadData() {
    setLoading(true);
    try {
      const res = await api("/me/pedidos-recebidos");
      setPedidos(res.dados || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleAceitar(id) {
    setError("");
    setSuccess("");
    try {
      await api(`/pedidos/${id}/aceitar`, { method: "PATCH" });
      setSuccess("Pedido aceito! Combine a entrega presencialmente com o aluno.");
      loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleRecusar(id) {
    if (!confirm("Recusar este pedido de interesse?")) return;
    setError("");
    setSuccess("");
    try {
      await api(`/pedidos/${id}/recusar`, { method: "PATCH" });
      setSuccess("Pedido recusado.");
      loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleConcluir(id) {
    if (!confirm("Confirmar que a entrega e negociação foram concluídas com sucesso?")) return;
    setError("");
    setSuccess("");
    try {
      await api(`/pedidos/${id}/concluir`, { method: "PATCH" });
      setSuccess("Negociação concluída com sucesso! O anúncio foi finalizado.");
      loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  const pendentes = pedidos.filter(p => p.status === "PENDENTE" || p.status === "ACEITO");
  const concluidos = pedidos.filter(p => p.status === "CONCLUIDO");
  const recusados = pedidos.filter(p => p.status === "RECUSADO" || p.status === "CANCELADO");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Gerenciamento de pedidos</h1>
          <p className="page-subtitle">
            Organizados do mais antigo para o mais recente — priorizando quem demonstrou interesse primeiro.
          </p>
        </div>
        <button className="btn btn-secondary" onClick={() => onNavigate("historico")}>
          Ver histórico
        </button>
      </div>

      <div className="tabs-filter">
        <button className={`tab-btn ${tab === "PENDENTES" ? "active" : ""}`} onClick={() => setTab("PENDENTES")}>
          Interesses em aberto · {pendentes.length}
        </button>
        <button className={`tab-btn ${tab === "CONCLUIDAS" ? "active" : ""}`} onClick={() => setTab("CONCLUIDAS")}>
          Concluídos · {concluidos.length}
        </button>
        <button className={`tab-btn ${tab === "RECUSADOS" ? "active" : ""}`} onClick={() => setTab("RECUSADOS")}>
          Recusados/Cancelados · {recusados.length}
        </button>
      </div>

      <Message message={error} />
      <Message message={success} type="success" />

      {loading ? (
        <p style={{ color: "var(--text-muted)" }}>Carregando pedidos...</p>
      ) : tab === "PENDENTES" && pendentes.length === 0 ? (
        <div className="alert-banner">
          <div className="alert-title">Nenhum pedido de interesse pendente</div>
          <div className="alert-desc">Seus anúncios estão visíveis no Brechó prontos para receber novos pedidos simultâneos.</div>
        </div>
      ) : tab === "CONCLUIDAS" && concluidos.length === 0 ? (
        <div className="alert-banner">
          <div className="alert-title">Nenhuma negociação concluída ainda</div>
          <div className="alert-desc">Ao concluir a entrega com um aluno, a negociação ficará arquivada aqui.</div>
        </div>
      ) : tab === "RECUSADOS" && recusados.length === 0 ? (
        <div className="alert-banner">
          <div className="alert-title">Nenhum pedido recusado</div>
          <div className="alert-desc">Nenhum pedido foi recusado ou cancelado até o momento.</div>
        </div>
      ) : (
        <div className="reservation-manage-layout">
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {(tab === "PENDENTES" ? pendentes : (tab === "CONCLUIDAS" ? concluidos : recusados)).map((p, idx) => (
              <div key={p.id} className="reservation-order-card">
                <div className="res-header-tag">
                  <span>
                    PEDIDO #{idx + 1} · {formatDateTime(p.criadoEm)}
                  </span>
                  <StatusBadge status={p.status} />
                </div>

                <div>
                  <span className="item-category-tag">
                    {formatLabel(p.anuncio?.categoria)} · {formatLabel(p.anuncio?.estadoConservacao)}
                  </span>
                  <h2 style={{ fontSize: "22px", fontWeight: "700", color: "var(--primary-dark)", marginTop: "4px" }}>
                    {p.anuncio?.item}
                  </h2>
                  <div className="item-price" style={{ marginTop: "6px" }}>{p.anuncio?.precoExibicao}</div>
                </div>

                {p.mensagem && (
                  <div style={{ background: "var(--bg-page)", padding: "12px 16px", borderRadius: "8px", fontSize: "14px", fontStyle: "italic", color: "var(--primary-dark)" }}>
                    "{p.mensagem}"
                  </div>
                )}

                <div className="res-student-info">
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <Avatar nome={p.interessado?.nome} fotoPerfil={p.interessado?.fotoPerfil} size={42} />
                    <div>
                      <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Estudante interessado</div>
                      <strong style={{ fontSize: "15px", color: "var(--primary-dark)" }}>
                        {p.interessado?.nome || "Aluno"}
                      </strong>
                      <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>{p.interessado?.email}</div>
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Demonstrou interesse em</div>
                    <strong style={{ fontSize: "14px", color: "var(--primary-dark)" }}>
                      {formatDateTime(p.criadoEm)}
                    </strong>
                  </div>
                </div>

                {p.status === "PENDENTE" && (
                  <div style={{ display: "flex", gap: "12px" }}>
                    <button className="btn btn-primary" onClick={() => handleAceitar(p.id)}>
                      Aceitar interesse
                    </button>
                    <button className="btn btn-outline-danger" onClick={() => handleRecusar(p.id)}>
                      Recusar pedido
                    </button>
                  </div>
                )}

                {p.status === "ACEITO" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <div className="alert-banner">
                      <div className="alert-title">Interesse aceito!</div>
                      <div className="alert-desc">Combine presencialmente na escola. Quando entregar o item, clique em concluir negociação.</div>
                    </div>
                    <div style={{ display: "flex", gap: "12px" }}>
                      <button className="btn btn-primary" onClick={() => handleConcluir(p.id)}>
                        Concluir negociação (Item entregue)
                      </button>
                      <button className="btn btn-outline-danger" onClick={() => handleRecusar(p.id)}>
                        Desistir / Recusar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div className="side-panel-card support-bg">
              <div className="side-panel-title">Critérios do anunciante</div>
              <div className="side-panel-desc">
                Os pedidos são listados em ordem cronológica (quem pediu primeiro fica no topo). Você tem total liberdade para escolher qual pedido aceitar com base nos seus critérios.
              </div>
            </div>

            <div className="side-panel-card">
              <div className="side-panel-title">Múltiplos pedidos simultâneos</div>
              <div className="side-panel-desc" style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <div>
                  <strong>Não bloqueia o anúncio:</strong><br/>
                  Receber um pedido não fecha o anúncio para outros interessados.
                </div>
                <div>
                  <strong>Conclusão da entrega:</strong><br/>
                  Ao confirmar a entrega, o item é concluído e os outros pedidos pendentes são encerrados automaticamente.
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

  // Formulário de avaliação para quando o aluno foi o comprador
  const [estrelas, setEstrelas] = useState(5);
  const [comentario, setComentario] = useState("");
  const [enviandoReview, setEnviandoReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState("");

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

  async function handleEnviarAvaliacao(e) {
    e.preventDefault();
    if (!selected) return;
    setEnviandoReview(true);
    setReviewSuccess("");
    setError("");
    try {
      await api("/avaliacoes", {
        method: "POST",
        body: JSON.stringify({
          alunoId: selected.anunciante?.id,
          anuncioId: selected.id,
          estrelas,
          comentario
        })
      });
      setReviewSuccess("Avaliação enviada com sucesso! Ela ficará visível no perfil do anunciante com sua foto.");
      setComentario("");
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviandoReview(false);
    }
  }

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

              {/* Formulário para avaliar o anunciante se este estudante foi o comprador */}
              {selected.papel === "INTERESSADO" && selected.anunciante?.id && (
                <div className="form-card" style={{ marginTop: "16px", padding: "20px" }}>
                  <h3 style={{ fontSize: "16px", fontWeight: "700", color: "var(--primary-dark)" }}>
                    Avaliar o anunciante ({selected.anunciante.nome})
                  </h3>
                  <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "2px" }}>
                    Compartilhe sua experiência sobre a entrega presencial do item.
                  </p>

                  <Message message={reviewSuccess} type="success" />

                  {!reviewSuccess && (
                    <form onSubmit={handleEnviarAvaliacao} style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "12px" }}>
                      <div>
                        <label className="form-label" style={{ marginBottom: "4px", display: "block" }}>Nota em estrelas:</label>
                        <StarRating value={estrelas} onChange={setEstrelas} readOnly={false} />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Comentário <span>(opcional)</span></label>
                        <textarea
                          className="input-control"
                          rows={3}
                          placeholder="Ex: Entrega pontual, produto em perfeito estado conforme o anúncio."
                          value={comentario}
                          onChange={(e) => setComentario(e.target.value)}
                        />
                      </div>

                      <button type="submit" className="btn btn-primary" style={{ alignSelf: "flex-start", fontSize: "13px" }} disabled={enviandoReview}>
                        {enviandoReview ? "Enviando avaliação..." : "Publicar avaliação"}
                      </button>
                    </form>
                  )}
                </div>
              )}
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
  const [meusPedidos, setMeusPedidos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api("/me/pedidos")
      .then(res => setMeusPedidos(res.dados || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const emAberto = meusPedidos.filter(p => p.status === "PENDENTE" || p.status === "ACEITO");
  const concluidos = meusPedidos.filter(p => p.status === "CONCLUIDO");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Olá, {aluno.nome}!</h1>
          <p className="page-subtitle">Encontre o que precisa e acompanhe seus pedidos de interesse em um só lugar.</p>
        </div>
      </div>

      <div className="side-panel-card support-bg" style={{ padding: "28px", display: "flex", flexDirection: "column", gap: "16px" }}>
        <h2 style={{ fontSize: "20px", fontWeight: "700", color: "var(--primary-dark)" }}>Seu próximo item pode estar aqui.</h2>
        <p style={{ fontSize: "14px", color: "var(--text-muted)" }}>
          Livros, uniformes e materiais de outros estudantes, prontos para um novo uso. Múltiplos pedidos podem ser feitos ao mesmo tempo.
        </p>
        <div>
          <button className="btn btn-primary" onClick={() => onNavigate("brecho")}>
            Explorar o Brechó
          </button>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ fontSize: "18px", fontWeight: "700", color: "var(--primary-dark)" }}>Meus pedidos de interesse</h2>
        <button
          className="btn btn-secondary"
          style={{ border: "none", color: "var(--primary)", fontWeight: "600" }}
          onClick={() => onNavigate("minhas-negociacoes")}
        >
          Ver todos os pedidos →
        </button>
      </div>

      <div className="metrics-row" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <div className="metric-card">
          <div className="metric-card-header">
            <span className="metric-number">{emAberto.length}</span>
            <span className="metric-label">Pedidos em aberto</span>
            <StatusBadge status="PENDENTE" />
          </div>
          {emAberto.length > 0 ? (
            <div style={{ marginTop: "8px" }}>
              <strong style={{ fontSize: "15px", color: "var(--primary-dark)" }}>{emAberto[0].anuncio?.item}</strong>
              <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                Anunciante: {emAberto[0].anuncio?.anunciante?.nome} · {emAberto[0].anuncio?.precoExibicao}
              </div>
              <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
                Enviado em {formatDateTime(emAberto[0].criadoEm)}
              </div>
            </div>
          ) : (
            <div className="metric-sub">Nenhum pedido em aberto no momento.</div>
          )}
        </div>

        <div className="metric-card">
          <div className="metric-card-header">
            <span className="metric-number">{concluidos.length}</span>
            <span className="metric-label">Negociações concluídas</span>
            <StatusBadge status="CONCLUIDO" />
          </div>
          {concluidos.length > 0 ? (
            <div style={{ marginTop: "8px" }}>
              <strong style={{ fontSize: "15px", color: "var(--primary-dark)" }}>{concluidos[0].anuncio?.item}</strong>
              <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                Anunciante: {concluidos[0].anuncio?.anunciante?.nome} · {concluidos[0].anuncio?.precoExibicao}
              </div>
              <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
                Concluído em {formatDate(concluidos[0].concluidoEm || concluidos[0].atualizadoEm)}
              </div>
            </div>
          ) : (
            <div className="metric-sub">Nenhuma negociação concluída ainda.</div>
          )}
        </div>
      </div>

      <div className="side-panel-card">
        <div className="side-panel-title">Como funciona a negociação?</div>
        <div className="side-panel-desc">
          Ao demonstrar interesse, seu pedido é enviado ao anunciante sem bloquear o anúncio para outros colegas. Ele analisa os pedidos e decide com quem negociar presencialmente no colégio.
        </div>
      </div>
    </div>
  );
}

/* ==========================================================
   ALUNO INTERESSADO - MEUS PEDIDOS DE INTERESSE
   ========================================================== */
function BuyerNegotiations() {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("TODOS");

  function loadData() {
    setLoading(true);
    api("/me/pedidos")
      .then(res => setPedidos(res.dados || []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleCancelarPedido(id) {
    if (!confirm("Deseja cancelar seu pedido de interesse para este anúncio?")) return;
    setError("");
    setSuccess("");
    try {
      await api(`/pedidos/${id}/cancelar`, { method: "PATCH" });
      setSuccess("Pedido de interesse cancelado com sucesso.");
      loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  const emAberto = pedidos.filter(p => p.status === "PENDENTE" || p.status === "ACEITO");
  const concluidosEOutros = pedidos.filter(p => p.status !== "PENDENTE" && p.status !== "ACEITO");

  const filtered = useMemo(() => {
    return pedidos.filter(p => {
      if (statusFilter !== "TODOS" && p.status !== statusFilter) return false;
      if (search) {
        const itemMatch = p.anuncio?.item?.toLowerCase().includes(search.toLowerCase());
        const autorMatch = p.anuncio?.anunciante?.nome?.toLowerCase().includes(search.toLowerCase());
        if (!itemMatch && !autorMatch) return false;
      }
      return true;
    });
  }, [pedidos, statusFilter, search]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Meus pedidos de interesse</h1>
          <p className="page-subtitle">Acompanhe seus pedidos em aberto e o histórico das suas negociações.</p>
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
          <option value="PENDENTE">Aguardando análise</option>
          <option value="ACEITO">Interesse aceito</option>
          <option value="CONCLUIDO">Concluído</option>
          <option value="RECUSADO">Recusado</option>
          <option value="CANCELADO">Cancelado</option>
        </select>
      </div>

      <Message message={error} />
      <Message message={success} type="success" />

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontSize: "18px", fontWeight: "700", color: "var(--primary-dark)" }}>Em andamento</h2>
          <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>{emAberto.length} pedido(s) em aberto</span>
        </div>

        {emAberto.length === 0 ? (
          <div className="alert-banner">
            <div className="alert-title">Nenhum pedido em andamento</div>
            <div className="alert-desc">Explore o Brechó para encontrar itens escolares e demonstrar interesse.</div>
          </div>
        ) : (
          emAberto.map(p => (
            <div key={p.id} className="form-card" style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "24px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <h3 style={{ fontSize: "20px", fontWeight: "700", color: "var(--primary-dark)" }}>
                    {p.anuncio?.item}
                  </h3>
                  <StatusBadge status={p.status} />
                </div>
                <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                  {formatLabel(p.anuncio?.categoria)} · {formatLabel(p.anuncio?.estadoConservacao)}
                </div>
                <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                  Anunciado por <strong>{p.anuncio?.anunciante?.nome}</strong>
                </div>
                <div className="item-price" style={{ marginTop: "8px" }}>{p.anuncio?.precoExibicao}</div>

                {p.mensagem && (
                  <div style={{ fontSize: "13px", color: "var(--text-muted)", fontStyle: "italic", background: "var(--bg-page)", padding: "8px 12px", borderRadius: "6px" }}>
                    Sua mensagem: "{p.mensagem}"
                  </div>
                )}

                <div style={{ marginTop: "8px" }}>
                  <button
                    className="btn btn-outline-danger"
                    style={{ fontSize: "13px", padding: "7px 14px" }}
                    onClick={() => handleCancelarPedido(p.id)}
                  >
                    Desistir / Cancelar pedido
                  </button>
                </div>
              </div>

              <div className="side-panel-card support-bg" style={{ padding: "16px" }}>
                <div className="side-panel-title">
                  {p.status === "ACEITO" ? "Interesse aceito pelo anunciante!" : `Aguardando análise de ${p.anuncio?.anunciante?.nome}`}
                </div>
                <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
                  Pedido enviado em {formatDateTime(p.criadoEm)}
                </div>
                <div style={{ fontSize: "13px", color: "var(--primary-dark)", marginTop: "8px", lineHeight: "1.4" }}>
                  {p.status === "ACEITO"
                    ? "O anunciante aceitou seu pedido! Combine presencialmente no colégio para concluir a entrega."
                    : "O anunciante analisa quem pediu primeiro e outros critérios para escolher com quem negociar."}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontSize: "18px", fontWeight: "700", color: "var(--primary-dark)" }}>Histórico de pedidos</h2>
          <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>{concluidosEOutros.length} negociação(ões) · somente leitura</span>
        </div>

        {concluidosEOutros.length === 0 ? (
          <p style={{ fontSize: "14px", color: "var(--text-muted)" }}>Nenhum pedido finalizado anteriormente.</p>
        ) : (
          concluidosEOutros.map(p => (
            <div key={p.id} className="item-row-card">
              <div>
                <strong style={{ fontSize: "16px", color: "var(--primary-dark)" }}>{p.anuncio?.item}</strong>
                <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                  {formatLabel(p.anuncio?.categoria)} · Anunciante: {p.anuncio?.anunciante?.nome}
                </div>
              </div>
              <div style={{ textAlign: "right", display: "flex", alignItems: "center", gap: "16px" }}>
                <span className="item-price" style={{ fontSize: "16px" }}>{p.anuncio?.precoExibicao}</span>
                <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                  {p.status === "CONCLUIDO" ? `Concluído em ${formatDate(p.concluidoEm || p.atualizadoEm)}` : p.status}
                </span>
                <StatusBadge status={p.status} />
              </div>
            </div>
          ))
        )}
      </div>

      <div className="side-panel-card support-bg" style={{ padding: "20px" }}>
        <div className="side-panel-title">Negociação presencial entre estudantes</div>
        <div className="side-panel-desc">
          O pedido de interesse sinaliza sua intenção. Combine pessoalmente com o colega anunciante os detalhes da entrega.
        </div>
      </div>
    </div>
  );
}

/* ==========================================================
   PERFIL DO ESTUDANTE (INFORMAÇÕES, AVALIAÇÕES E COMENTÁRIOS)
   ========================================================== */
function ProfileView({ aluno, onAlunoUpdated }) {
  const [perfil, setPerfil] = useState(null);
  const [avaliacoes, setAvaliacoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [novaNota, setNovaNota] = useState(5);
  const [novoComentario, setNovoComentario] = useState("");
  const [enviandoAvaliacao, setEnviandoAvaliacao] = useState(false);
  const fileInputRef = useRef(null);

  async function loadProfile() {
    setLoading(true);
    try {
      const [data, reviewsRes] = await Promise.all([
        api("/me/perfil"),
        api(`/alunos/${aluno.id}/avaliacoes`).catch(() => ({ dados: [] }))
      ]);
      setPerfil(data);
      setAvaliacoes(reviewsRes.dados || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProfile();
  }, [aluno.id]);

  async function handlePhotoSelected(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError("");
    setSuccess("");

    try {
      const formData = new FormData();
      formData.append("foto", file);

      const res = await api("/me/foto", {
        method: "PATCH",
        body: formData
      });

      setSuccess("Foto de perfil atualizada com sucesso!");
      onAlunoUpdated(res.aluno);
      loadProfile();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleToggleFixar(avaliacaoId) {
    setError("");
    setSuccess("");
    try {
      await api(`/avaliacoes/${avaliacaoId}/fixar`, { method: "PATCH" });
      setSuccess("Destaque atualizado com sucesso!");
      loadProfile();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Meu perfil</h1>
          <p className="page-subtitle">Visualize suas estatísticas acadêmicas, avaliações da comunidade e gerencie sua foto.</p>
        </div>
      </div>

      <Message message={error} />
      <Message message={success} type="success" />

      {loading ? (
        <p style={{ color: "var(--text-muted)" }}>Carregando perfil...</p>
      ) : (
        <div className="form-layout">
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div className="form-card" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                <Avatar nome={aluno.nome} fotoPerfil={aluno.fotoPerfil} size={84} />
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <h2 style={{ fontSize: "22px", fontWeight: "700", color: "var(--primary-dark)" }}>
                    {aluno.nome}
                  </h2>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <StarRating value={perfil?.mediaAvaliacoes || 0} />
                    <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                      ({perfil?.totalAvaliacoes || 0} avaliação{perfil?.totalAvaliacoes !== 1 ? "ões" : ""})
                    </span>
                  </div>
                  <div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/png, image/jpeg, image/webp"
                      style={{ display: "none" }}
                      onChange={handlePhotoSelected}
                    />
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ fontSize: "13px", padding: "6px 14px" }}
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                    >
                      {uploading ? "Enviando..." : "Alterar foto de perfil"}
                    </button>
                  </div>
                </div>
              </div>

              <div style={{ borderTop: "1px solid var(--border-light)", paddingTop: "20px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "600" }}>NOME COMPLETO</span>
                  <p style={{ fontSize: "15px", color: "var(--primary-dark)", fontWeight: "600", marginTop: "2px" }}>
                    {aluno.nome}
                  </p>
                </div>

                <div>
                  <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "600" }}>E-MAIL ESTUDANTIL</span>
                  <p style={{ fontSize: "15px", color: "var(--primary-dark)", fontWeight: "600", marginTop: "2px" }}>
                    {aluno.email}
                  </p>
                </div>

                <div>
                  <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "600" }}>DATA DE CADASTRO</span>
                  <p style={{ fontSize: "15px", color: "var(--primary-dark)", fontWeight: "500", marginTop: "2px" }}>
                    {formatDate(aluno.criadoEm || perfil?.criadoEm)}
                  </p>
                </div>

                <div>
                  <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "600" }}>STATUS DA CONTA</span>
                  <p style={{ fontSize: "15px", color: "var(--primary)", fontWeight: "600", marginTop: "2px" }}>
                    Estudante ativo
                  </p>
                </div>
              </div>

              <div style={{ borderTop: "1px solid var(--border-light)", paddingTop: "16px" }}>
                <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "600" }}>SUA PRIVACIDADE</span>
                <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "4px", lineHeight: "1.5" }}>
                  Seu e-mail é utilizado apenas para autenticação e registro. Ele não é compartilhado com terceiros e todas as negociações do Brechó ocorrem presencialmente no ambiente escolar.
                </p>
              </div>
            </div>

            {/* Seção de Comentários e Avaliações Recebidos */}
            <div className="form-card" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ fontSize: "18px", fontWeight: "700", color: "var(--primary-dark)" }}>
                  Avaliações e comentários recebidos
                </h3>
                <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                  {avaliacoes.length} comentário(s)
                </span>
              </div>

              {avaliacoes.length === 0 ? (
                <div className="alert-banner">
                  <div className="alert-title">Nenhuma avaliação ainda</div>
                  <div className="alert-desc">Ao concluir negociações com outros estudantes, as avaliações com fotos e comentários aparecerão aqui.</div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {avaliacoes.map((av) => (
                    <div key={av.id} className={`review-card ${av.fixado ? "pinned" : ""}`}>
                      <div className="review-header">
                        <div className="review-author-wrap">
                          <Avatar nome={av.autor?.nome} fotoPerfil={av.autor?.fotoPerfil} size={36} />
                          <div>
                            <strong style={{ fontSize: "14px", color: "var(--primary-dark)" }}>{av.autor?.nome}</strong>
                            <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>{formatDate(av.criadoEm)}</div>
                          </div>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <StarRating value={av.estrelas} readOnly={true} />
                          <button
                            type="button"
                            className="pin-toggle-btn"
                            onClick={() => handleToggleFixar(av.id)}
                            title="Fixar comentário em destaque no perfil"
                          >
                            {av.fixado ? "★ Em destaque" : "Fixar no topo"}
                          </button>
                        </div>
                      </div>

                      {av.fixado && (
                        <div className="pinned-badge">
                          📌 Comentário em destaque pelo anunciante
                        </div>
                      )}

                      {av.comentario && (
                        <p style={{ fontSize: "14px", color: "var(--primary-dark)", lineHeight: "1.5", margin: 0 }}>
                          "{av.comentario}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div className="side-panel-card support-bg">
              <div className="side-panel-title">Métricas de atividade</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "14px", color: "var(--primary-dark)" }}>Anúncios ativos</span>
                  <strong style={{ fontSize: "18px", color: "var(--primary-dark)" }}>{perfil?.totalAtivos ?? 0} / 5</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "14px", color: "var(--primary-dark)" }}>Pedidos de interesse feitos</span>
                  <strong style={{ fontSize: "18px", color: "var(--primary-dark)" }}>{perfil?.totalPedidosRealizados ?? 0}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "14px", color: "var(--primary-dark)" }}>Produtos negociados</span>
                  <strong style={{ fontSize: "18px", color: "var(--primary)" }}>{perfil?.totalProdutosNegociados ?? 0}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "14px", color: "var(--primary-dark)" }}>Média de avaliações</span>
                  <strong style={{ fontSize: "18px", color: "#f59e0b" }}>★ {perfil?.mediaAvaliacoes || "—"}</strong>
                </div>
              </div>
            </div>

            <div className="side-panel-card">
              <div className="side-panel-title">Comentário em destaque</div>
              <div className="side-panel-desc">
                No perfil do aluno anunciante, você pode fixar um único comentário recebido em destaque. Ao fixar outro, ele substitui automaticamente o destaque anterior.
              </div>
            </div>
          </div>
        </div>
      )}
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
    localStorage.removeItem("brecho_role");
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
          <div className="profile-avatar-wrap">
            <Avatar nome={aluno.nome} fotoPerfil={aluno.fotoPerfil} size={44} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="profile-name" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {aluno.nome}
              </div>
              <div className="profile-role">
                {isAnunciante ? "Aluno anunciante" : "Aluno interessado"}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button className="role-switch-btn" style={{ flex: 1 }} onClick={handleRoleToggle}>
              Mudar cargo ⇄
            </button>
            <button
              className="role-switch-btn"
              style={{ padding: "8px 10px" }}
              title="Ver meu perfil"
              onClick={() => { setSelectedItem(null); setEditingItem(null); setPage("perfil"); }}
            >
              Perfil
            </button>
          </div>
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
              <button
                className={`nav-item ${page === "perfil" ? "active" : ""}`}
                onClick={() => { setSelectedItem(null); setEditingItem(null); setPage("perfil"); }}
              >
                Meu perfil
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
              <button
                className={`nav-item ${page === "perfil" ? "active" : ""}`}
                onClick={() => { setSelectedItem(null); setEditingItem(null); setPage("perfil"); }}
              >
                Meu perfil
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
              page === "gerenciamento" ? "ESPAÇO DO ANUNCIANTE" :
              page === "perfil" ? "MEU PERFIL · DADOS ACADÊMICOS" : "ESPAÇO DO ANUNCIANTE"
            ) : (
              page === "perfil" ? "MEU PERFIL · DADOS ACADÊMICOS" : "ESPAÇO DO INTERESSADO"
            )}
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
              {page === "perfil" && (
                <ProfileView aluno={aluno} onAlunoUpdated={setAluno} />
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
              {page === "perfil" && (
                <ProfileView aluno={aluno} onAlunoUpdated={setAluno} />
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

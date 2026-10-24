import { useEffect, useMemo, useState } from "react";
import { api } from "./api";

const CATEGORIAS = ["UNIFORME", "MATERIAL_ESCOLAR", "LIVRO", "ELETRONICO", "OUTRO"];
const ESTADOS = ["NOVO", "BOM", "USADO"];

function Message({ message, type = "error" }) {
  return message ? <p className={"message " + type}>{message}</p> : null;
}

function Price({ anuncio }) {
  return <strong>{anuncio.precoExibicao}</strong>;
}

function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit(event) {
    event.preventDefault();
    setLoading(true); setError("");
    try {
      const result = await api("/auth/login", { method: "POST", body: JSON.stringify({ email, senha }) });
      localStorage.setItem("brecho_token", result.token);
      onLogin(result.aluno);
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  }
  return <main className="login"><form onSubmit={submit} className="card">
    <h1>Brechó Estudantil</h1><p>Entre para anunciar, encontrar e reservar itens escolares.</p>
    <label>E-mail<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
    <label>Senha<input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} required /></label>
    <Message message={error} /><button disabled={loading}>{loading ? "Entrando..." : "Entrar"}</button>
  </form></main>;
}

function AnnouncementCard({ anuncio, onDetails, onEdit, onCancel }) {
  return <article className="card announcement">
    <span className="badge">{anuncio.status}</span><h3>{anuncio.item}</h3>
    <p>{anuncio.categoria} · {anuncio.estadoConservacao}</p><Price anuncio={anuncio} />
    <div className="actions"><button onClick={() => onDetails?.(anuncio)}>Detalhes</button>
      {onEdit && anuncio.status === "DISPONIVEL" && <button onClick={() => onEdit(anuncio)}>Editar</button>}
      {onCancel && !["CONCLUIDO", "CANCELADO"].includes(anuncio.status) && <button className="danger" onClick={() => onCancel(anuncio)}>Cancelar</button>}
    </div>
  </article>;
}

function Catalog({ onDetails }) {
  const [items, setItems] = useState([]); const [query, setQuery] = useState({ busca: "", categoria: "", estado: "" });
  const [loading, setLoading] = useState(true); const [error, setError] = useState("");
  async function load() {
    setLoading(true); setError("");
    try {
      const params = new URLSearchParams(Object.entries(query).filter(([, value]) => value));
      const result = await api("/anuncios?" + params.toString()); setItems(result.dados);
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);
  return <section><h2>Brechó</h2><form className="filters" onSubmit={(e) => { e.preventDefault(); load(); }}>
    <input placeholder="Buscar por item..." value={query.busca} onChange={(e) => setQuery({ ...query, busca: e.target.value })} />
    <select value={query.categoria} onChange={(e) => setQuery({ ...query, categoria: e.target.value })}><option value="">Todas as categorias</option>{CATEGORIAS.map((x) => <option key={x}>{x}</option>)}</select>
    <select value={query.estado} onChange={(e) => setQuery({ ...query, estado: e.target.value })}><option value="">Toda conservação</option>{ESTADOS.map((x) => <option key={x}>{x}</option>)}</select>
    <button>Filtrar</button></form><Message message={error} />
    {loading ? <p>Carregando anúncios...</p> : items.length ? <div className="grid">{items.map((item) => <AnnouncementCard key={item.id} anuncio={item} onDetails={onDetails} />)}</div> : <p>Nenhum anúncio disponível para estes filtros.</p>}
  </section>;
}

function Detail({ anuncio, aluno, onBack, onReserved }) {
  const [error, setError] = useState(""); const [success, setSuccess] = useState(""); const canReserve = anuncio.status === "DISPONIVEL" && anuncio.anunciante?.id !== aluno.id;
  async function reserve() {
    setError(""); try { await api("/anuncios/" + anuncio.id + "/reservas", { method: "POST" }); setSuccess("Item reservado. Acompanhe em Minhas reservas."); onReserved(); } catch (err) { setError(err.message); }
  }
  return <section><button onClick={onBack}>← Voltar</button><article className="card detail"><span className="badge">{anuncio.status}</span><h2>{anuncio.item}</h2><p>{anuncio.descricao}</p>
    <p>Categoria: {anuncio.categoria} · Conservação: {anuncio.estadoConservacao}</p><Price anuncio={anuncio} /><p>Anunciante: {anuncio.anunciante?.nome}</p>
    {canReserve && <button onClick={reserve}>Reservar item</button>}<Message message={success} type="success" /><Message message={error} /></article></section>;
}

function AnnouncementForm({ editing, onDone }) {
  const initial = editing || { item: "", descricao: "", categoria: "LIVRO", estadoConservacao: "BOM", preco: "" };
  const [form, setForm] = useState(initial); const [error, setError] = useState(""); const [success, setSuccess] = useState("");
  function field(name, value) { setForm({ ...form, [name]: value }); }
  async function submit(event) {
    event.preventDefault(); setError(""); setSuccess("");
    try {
      const path = editing ? "/anuncios/" + editing.id : "/anuncios";
      await api(path, { method: editing ? "PATCH" : "POST", body: JSON.stringify(form) });
      setSuccess(editing ? "Anúncio atualizado." : "Anúncio criado."); if (!editing) setForm(initial); onDone?.();
    } catch (err) { setError(err.message); }
  }
  return <section><h2>{editing ? "Editar anúncio" : "Cadastro de anúncio"}</h2><form onSubmit={submit} className="card form">
    <label>Item<input value={form.item} onChange={(e) => field("item", e.target.value)} required /></label>
    <label>Descrição<textarea value={form.descricao} onChange={(e) => field("descricao", e.target.value)} required /></label>
    <label>Categoria<select value={form.categoria} onChange={(e) => field("categoria", e.target.value)}>{CATEGORIAS.map((x) => <option key={x}>{x}</option>)}</select></label>
    <label>Conservação<select value={form.estadoConservacao} onChange={(e) => field("estadoConservacao", e.target.value)}>{ESTADOS.map((x) => <option key={x}>{x}</option>)}</select></label>
    <label>Preço (deixe vazio para Troca)<input type="number" min="0" step="0.01" value={form.preco} onChange={(e) => field("preco", e.target.value)} /></label>
    <button>Salvar anúncio</button><Message message={success} type="success" /><Message message={error} /></form></section>;
}

function Store({ onDetails, onEdit }) {
  const [items, setItems] = useState([]); const [error, setError] = useState("");
  async function load() { try { setItems((await api("/me/anuncios")).dados); } catch (err) { setError(err.message); } }
  useEffect(() => { load(); }, []);
  async function cancel(item) { if (!confirm("Cancelar este anúncio?")) return; try { await api("/anuncios/" + item.id, { method: "DELETE" }); load(); } catch (err) { setError(err.message); } }
  return <section><h2>Minha vitrine</h2><Message message={error} />{items.length ? <div className="grid">{items.map((item) => <AnnouncementCard key={item.id} anuncio={item} onDetails={onDetails} onEdit={onEdit} onCancel={cancel} />)}</div> : <p>Você ainda não publicou anúncios.</p>}</section>;
}

function Reservations() {
  const [made, setMade] = useState([]); const [received, setReceived] = useState([]); const [error, setError] = useState("");
  async function load() { try { const [a, b] = await Promise.all([api("/me/reservas"), api("/me/reservas-recebidas")]); setMade(a.dados); setReceived(b.dados); } catch (err) { setError(err.message); } }
  useEffect(() => { load(); }, []);
  async function confirm(id) { try { await api("/reservas/" + id + "/confirmacao", { method: "PATCH" }); load(); } catch (err) { setError(err.message); } }
  return <section><h2>Minhas reservas</h2><Message message={error} /><h3>Reservas feitas</h3>{made.length ? <ul>{made.map((r) => <li key={r.id}>{r.anuncio?.item} — {r.status} {r.status === "ATIVA" ? "até " + new Date(r.expiraEm).toLocaleDateString("pt-BR") : ""}</li>)}</ul> : <p>Nenhuma reserva feita.</p>}
    <h3>Reservas recebidas</h3>{received.length ? <ul>{received.map((r) => <li key={r.id}>{r.anuncio?.item} — {r.interessado?.nome} — {r.status} {r.status === "ATIVA" && <button onClick={() => confirm(r.id)}>Confirmar negociação</button>}</li>)}</ul> : <p>Nenhuma reserva recebida.</p>}</section>;
}

function History() {
  const [items, setItems] = useState([]); const [error, setError] = useState("");
  useEffect(() => { api("/me/negociacoes").then((r) => setItems(r.dados)).catch((e) => setError(e.message)); }, []);
  return <section><h2>Histórico</h2><Message message={error} />{items.length ? <div className="grid">{items.map((item) => <AnnouncementCard key={item.id} anuncio={item} />)}</div> : <p>Nenhuma negociação concluída.</p>}</section>;
}

function Menu() {
  const [data, setData] = useState(null); const [error, setError] = useState("");
  useEffect(() => { api("/indicadores").then(setData).catch((e) => setError(e.message)); }, []);
  return <section><h2>Menu</h2><p>Publique itens, procure ofertas e acompanhe suas negociações.</p><Message message={error} />{data && <div className="grid indicators"><article className="card"><h3>Por status</h3>{data.totalPorStatus.map((x) => <p key={x.status}>{x.status}: {x.total}</p>)}</article><article className="card"><h3>Por categoria</h3>{data.totalPorCategoria.map((x) => <p key={x.categoria}>{x.categoria}: {x.total}</p>)}</article></div>}</section>;
}

export default function App() {
  const [aluno, setAluno] = useState(null); const [page, setPage] = useState("menu"); const [selected, setSelected] = useState(null); const [editing, setEditing] = useState(null);
  useEffect(() => { if (localStorage.getItem("brecho_token")) api("/me").then((r) => setAluno(r.aluno)).catch(() => localStorage.removeItem("brecho_token")); }, []);
  const content = useMemo(() => {
    if (selected) return <Detail anuncio={selected} aluno={aluno} onBack={() => setSelected(null)} onReserved={() => { setSelected(null); setPage("reservas"); }} />;
    if (editing) return <AnnouncementForm editing={editing} onDone={() => { setEditing(null); setPage("vitrine"); }} />;
    if (page === "brecho") return <Catalog onDetails={setSelected} />;
    if (page === "cadastro") return <AnnouncementForm onDone={() => setPage("vitrine")} />;
    if (page === "vitrine") return <Store onDetails={setSelected} onEdit={setEditing} />;
    if (page === "reservas") return <Reservations />;
    if (page === "historico") return <History />;
    return <Menu />;
  }, [page, selected, editing, aluno]);
  if (!aluno) return <Login onLogin={setAluno} />;
  const nav = [["menu", "Menu"], ["brecho", "Brechó"], ["cadastro", "Cadastro"], ["vitrine", "Minha vitrine"], ["reservas", "Minhas reservas"], ["historico", "Histórico"]];
  return <div className="app"><aside><h1>Brechó</h1><p>{aluno.nome}</p>{nav.map(([key, label]) => <button className={page === key ? "active" : ""} key={key} onClick={() => { setSelected(null); setEditing(null); setPage(key); }}>{label}</button>)}<button className="logout" onClick={() => { localStorage.removeItem("brecho_token"); setAluno(null); }}>Sair</button></aside><main><header><span>BRECHÓ ESTUDANTIL</span></header>{content}</main></div>;
}

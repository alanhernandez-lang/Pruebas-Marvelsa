import React, { useState, useEffect } from 'react';
import axios, { BASE_API_URL } from '../api';
import io from 'socket.io-client';

const socket = io(BASE_API_URL);

function AdminDashboard() {
    const [stats, setStats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('depts');

    // CRUD State
    const [depts, setDepts] = useState([]);
    const [presenters, setPresenters] = useState([]);
    const [people, setPeople] = useState([]);

    // Editing State
    const [editingDeptId, setEditingDeptId] = useState(null);
    const [editingPerson, setEditingPerson] = useState(null); // {id, type}
    const [editingPresenterId, setEditingPresenterId] = useState(null);

    // Form inputs
    const [newDeptName, setNewDeptName] = useState('');
    const [newDeptOrder, setNewDeptOrder] = useState(0);
    const [newPerson, setNewPerson] = useState({ name: '', phone: '', countryCode: '521', isJury: false });
    const [newPresenter, setNewPresenter] = useState({ name: '', department_id: '', photo: null });

    // WhatsApp State
    const [selectedTemplate, setSelectedTemplate] = useState('antes_rock_launch');
    const [broadcastUrl, setBroadcastUrl] = useState(window.location.origin);
    const [isBroadcasting, setIsBroadcasting] = useState(false);
    const [metaMediaId, setMetaMediaId] = useState(null);
    const [isUploadingMeta, setIsUploadingMeta] = useState(false);

    const fetchData = async () => {
        try {
            const [deptsRes, presRes, peopleRes] = await Promise.all([
                axios.get('departments'),
                axios.get('admin/presenters'),
                axios.get('admin/people')
            ]);
            const sortedDepts = (deptsRes.data || []).sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
            setDepts(sortedDepts);
            setPresenters(presRes.data);
            setPeople(peopleRes.data);

            const mediaRes = await axios.get('whatsapp/media-info');
            setMetaMediaId(mediaRes.data.media_id);

            setLoading(false);
        } catch (err) {
            console.error("Error fetching admin data", err);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        socket.on('vote_update', fetchData);
        return () => socket.off('vote_update');
    }, []);

    // Change URL based on template
    useEffect(() => {
        if (selectedTemplate === 'antes_rock_launch') {
            setBroadcastUrl(window.location.origin);
        } else {
            setBroadcastUrl(window.location.origin + '/votar');
        }
    }, [selectedTemplate]);

    // Handlers
    const handleAddDept = async (e) => {
        e.preventDefault();
        try {
            if (editingDeptId) {
                await axios.put(`admin/departments/${editingDeptId}`, { name: newDeptName, display_order: newDeptOrder });
                setEditingDeptId(null);
            } else {
                await axios.post('admin/departments', { name: newDeptName, display_order: newDeptOrder });
            }
            setNewDeptName('');
            setNewDeptOrder(0);
            fetchData();
        } catch (err) {
            console.error(err);
            alert("Error saving department: " + (err.response?.data?.error || err.message));
        }
    };

    const handleEditDept = (dept) => {
        setEditingDeptId(dept.id);
        setNewDeptName(dept.name);
        setNewDeptOrder(dept.display_order || 0);
    };

    const handleDeleteDept = async (id) => {
        if (!window.confirm("¿Seguro que quieres eliminar este departamento?")) return;
        try {
            await axios.delete(`admin/departments/${id}`);
            fetchData();
        } catch (err) {
            console.error(err);
            alert("Error deleting department: " + (err.response?.data?.error || err.message));
        }
    };

    const handleAddPerson = async (e) => {
        e.preventDefault();
        try {
            const personToSave = {
                name: newPerson.name,
                phone: `${newPerson.countryCode}${newPerson.phone}`,
                isJury: newPerson.isJury
            };

            if (editingPerson) {
                await axios.put(`admin/people/${editingPerson.type}/${editingPerson.id}`, personToSave);
                setEditingPerson(null);
            } else {
                await axios.post('admin/people', personToSave);
            }
            setNewPerson({ name: '', phone: '', countryCode: '521', isJury: false });
            fetchData();
        } catch (err) {
            console.error(err);
            alert("Error saving person: " + (err.response?.data?.error || err.message));
        }
    };

    const handleEditPerson = (p) => {
        setEditingPerson(p);

        // Try to separate country code from the 10-digit phone
        let phone = p.phone || '';
        let countryCode = '521';

        if (phone.length > 10) {
            phone = phone.slice(-10);
            countryCode = p.phone.slice(0, p.phone.length - 10);
        }

        setNewPerson({
            name: p.name,
            phone: phone,
            countryCode: countryCode,
            isJury: p.type === 'JURY'
        });
    };

    const handleDeletePerson = async (id, type) => {
        if (!window.confirm("¿Seguro que quieres eliminar esta persona?")) return;
        try {
            await axios.delete(`admin/people/${type}/${id}`);
            fetchData();
        } catch (err) {
            console.error(err);
            alert("Error deleting person: " + (err.response?.data?.error || err.message));
        }
    };

    const handleImportPerson = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const formData = new FormData();
        formData.append('file', file);
        try {
            const res = await axios.post('admin/people/import', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert(`${res.data.message}\n${res.data.details || ''}`);
            fetchData();
        } catch (err) {
            console.error(err);
            alert("Error al importar: " + (err.response?.data?.error || err.message));
        }
    };

    const handleAddPresenter = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('name', newPresenter.name);
        formData.append('department_id', newPresenter.department_id);
        if (newPresenter.photo) formData.append('photo', newPresenter.photo);

        try {
            if (editingPresenterId) {
                await axios.put(`admin/presenters/${editingPresenterId}`, formData);
                setEditingPresenterId(null);
            } else {
                await axios.post('admin/presenters', formData);
            }
            setNewPresenter({ name: '', department_id: '', photo: null });
            fetchData();
        } catch (err) {
            console.error(err);
            alert("Error saving presenter: " + (err.response?.data?.error || err.message));
        }
    };

    const handleEditPresenter = (p) => {
        setEditingPresenterId(p.id);
        setNewPresenter({ name: p.name, department_id: p.department_id, photo: null });
    };

    const handleDeletePresenter = async (id) => {
        if (!window.confirm("¿Seguro que quieres eliminar al presentador?")) return;
        try {
            await axios.delete(`admin/presenters/${id}`);
            fetchData();
        } catch (err) {
            console.error(err);
            alert("Error deleting presenter: " + (err.response?.data?.error || err.message));
        }
    };

    const handleSendIndividualWhatsApp = async (person) => {
        if (!window.confirm(`¿Enviar WhatsApp a ${person.name}?`)) return;
        try {
            // Conditional URL: if template is 'antes_rock_launch', don't send token
            const finalUrl = selectedTemplate === 'antes_rock_launch'
                ? broadcastUrl
                : `${broadcastUrl}${broadcastUrl.includes('?') ? '&' : '?'}token=${person.token}`;

            await axios.post('whatsapp/send', {
                phone: person.phone,
                templateName: selectedTemplate,
                variables: [
                    person.name,
                    finalUrl
                ]
            });
            alert("Mensaje enviado con éxito");
        } catch (err) {
            console.error(err);
            const detail = err.response?.data?.details;
            const metaMessage = detail?.error?.message || detail?.message || "";
            const errorMsg = metaMessage ? `${metaMessage}` : (err.response?.data?.error || err.message);

            alert("⚠️ Error de WhatsApp:\n" + errorMsg);
        }
    };

    const handleSendBulkWhatsApp = async () => {
        if (people.length === 0) return alert("No hay personas registradas");
        if (!window.confirm(`¿Enviar WhatsApp a las ${people.length} personas registradas?`)) return;

        setIsBroadcasting(true);
        try {
            const res = await axios.post('whatsapp/send-bulk', {
                people,
                templateName: selectedTemplate,
                url: broadcastUrl
            });
            alert(`Envío masivo completado.\nÉxito: ${res.data.success}\nFallidos: ${res.data.failed}`);
            fetchData();
        } catch (err) {
            console.error(err);
            alert("Error sending bulk: " + (err.response?.data?.error || err.message));
        } finally {
            setIsBroadcasting(false);
        }
    };

    const handleUploadMeta = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('image', file);
        setIsUploadingMeta(true);
        try {
            const res = await axios.post('whatsapp/upload-meta', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setMetaMediaId(res.data.media_id);
            alert("✅ Imagen oficial actualizada en Meta Cloud con éxito.\nID: " + res.data.media_id);
            fetchData();
        } catch (err) {
            console.error(err);
            alert("❌ Error al subir a Meta: " + JSON.stringify(err.response?.data?.details || err.message));
        } finally {
            setIsUploadingMeta(false);
        }
    };

    const handleSyncTokens = async () => {
        try {
            await axios.post('admin/people/sync-tokens');
            alert("Sincronización de tokens iniciada");
            fetchData();
        } catch (err) {
            console.error(err);
            alert("Error syncing tokens: " + (err.response?.data?.error || err.message));
        }
    };

    if (loading) return <div className="container">Cargando dashboard...</div>;

    return (
        <div className="container">
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 className="title" style={{ fontSize: '2rem', margin: 0 }}>ADMIN PANEL</h1>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button className={activeTab === 'depts' ? "btn-primary" : "btn-secondary"} onClick={() => setActiveTab('depts')}>Departamentos</button>
                    <button className={activeTab === 'presenters' ? "btn-primary" : "btn-secondary"} onClick={() => setActiveTab('presenters')}>Presentadores</button>
                    <button className={activeTab === 'people' ? "btn-primary" : "btn-secondary"} onClick={() => setActiveTab('people')}>Personas</button>
                </div>
            </header>

            {activeTab === 'depts' && (
                <div className="card glass">
                    <h3>{editingDeptId ? 'Editar Departamento' : 'Añadir Departamento'}</h3>
                    <form onSubmit={handleAddDept} style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                        <input type="text" placeholder="Nombre del departamento" value={newDeptName} onChange={e => setNewDeptName(e.target.value)} required style={{ flex: 1 }} />
                        <input type="number" placeholder="Orden" value={newDeptOrder} onChange={e => setNewDeptOrder(e.target.value)} style={{ width: '80px' }} />
                        <button type="submit" className="btn-primary">{editingDeptId ? 'Guardar' : 'Añadir'}</button>
                        {editingDeptId && <button type="button" className="btn-secondary" onClick={() => { setEditingDeptId(null); setNewDeptName(''); setNewDeptOrder(0); }}>Cancelar</button>}
                    </form>
                    <div className="grid-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
                        {depts.map(d => (
                            <div key={d.id} className="card-sm" style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                                <div style={{ fontWeight: 'bold' }}>{d.name}</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Posición: {d.display_order || 0}</div>
                                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                                    <button className="btn-secondary" style={{ padding: '6px 12px' }} onClick={() => handleEditDept(d)}>Editar</button>
                                    <button className="btn-danger-sm" style={{ padding: '6px 12px' }} onClick={() => handleDeleteDept(d.id)}>Eliminar</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'presenters' && (
                <div className="card glass">
                    <h3 style={{ marginBottom: '1.5rem' }}>{editingPresenterId ? 'Editar Presentador' : 'Gestionar Presentadores'}</h3>
                    <form onSubmit={handleAddPresenter} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                        <input type="text" placeholder="Nombre completo" value={newPresenter.name} onChange={e => setNewPresenter({ ...newPresenter, name: e.target.value })} required />
                        <select value={newPresenter.department_id} onChange={e => setNewPresenter({ ...newPresenter, department_id: e.target.value })} required>
                            <option value="">Seleccionar Departamento</option>
                            {depts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                        <div style={{ gridColumn: 'span 2' }}>
                            <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Foto del presentador {editingPresenterId && '(dejar vacío para mantener actual)'}:</label>
                            <input type="file" accept="image/*" onChange={e => setNewPresenter({ ...newPresenter, photo: e.target.files[0] })} />
                        </div>
                        <div style={{ gridColumn: 'span 2', display: 'flex', gap: '1rem' }}>
                            <button type="submit" className="btn-primary" style={{ flex: 1 }}>{editingPresenterId ? 'Guardar Cambios' : 'Registrar Presentador'}</button>
                            {editingPresenterId && <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => { setEditingPresenterId(null); setNewPresenter({ name: '', department_id: '', photo: null }); }}>Cancelar</button>}
                        </div>
                    </form>

                    {/* Compact presenter grid — 5 per row */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.75rem' }}>
                        {presenters.map(p => (
                            <div key={p.id} style={{
                                background: 'rgba(255,255,255,0.04)',
                                border: '1px solid rgba(255,255,255,0.09)',
                                borderRadius: '12px',
                                padding: '0.75rem',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '0.4rem',
                                backdropFilter: 'blur(12px)',
                                transition: 'background 0.2s',
                            }}>
                                {/* Square photo */}
                                {p.photo_url
                                    ? <img
                                        src={p.photo_url.startsWith('data:') ? p.photo_url : `${BASE_API_URL}${p.photo_url}`}
                                        alt={p.name}
                                        style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px', flexShrink: 0 }}
                                    />
                                    : <div style={{
                                        width: '80px', height: '80px', borderRadius: '8px',
                                        background: 'rgba(91,113,119,0.25)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '1.8rem', color: 'var(--text-muted)'
                                    }}>👤</div>
                                }
                                <div style={{ fontWeight: '700', fontSize: '0.82rem', textAlign: 'center', lineHeight: '1.2', color: 'var(--text)' }}>{p.name}</div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'center' }}>{p.department_name}</div>
                                <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.25rem', width: '100%' }}>
                                    <button
                                        className="btn-secondary"
                                        style={{ flex: 1, padding: '4px 6px', fontSize: '0.72rem', borderRadius: '6px' }}
                                        onClick={() => handleEditPresenter(p)}
                                    >Editar</button>
                                    <button
                                        style={{
                                            flex: 1, padding: '4px 6px', fontSize: '0.72rem', borderRadius: '6px',
                                            background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)',
                                            color: '#ef4444', cursor: 'pointer', fontWeight: '600', fontFamily: 'inherit'
                                        }}
                                        onClick={() => handleDeletePresenter(p.id)}
                                    >Eliminar</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}


            {activeTab === 'people' && (
                <div className="card glass">
                    <h3>{editingPerson ? 'Editar Persona' : 'Registro de Personas (Jurado y Público)'}</h3>
                    <form onSubmit={handleAddPerson} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 1fr auto', gap: '1rem', marginBottom: '1rem', alignItems: 'center' }}>
                        <input type="text" placeholder="Nombre completo" value={newPerson.name} onChange={e => setNewPerson({ ...newPerson, name: e.target.value })} required />
                        <input type="text" placeholder="Clave" value={newPerson.countryCode} onChange={e => setNewPerson({ ...newPerson, countryCode: e.target.value.replace(/\D/g, '') })} required />
                        <input type="tel" placeholder="Teléfono" value={newPerson.phone} onChange={e => setNewPerson({ ...newPerson, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })} required />
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                            <input type="checkbox" checked={newPerson.isJury} onChange={e => setNewPerson({ ...newPerson, isJury: e.target.checked })} style={{ width: 'auto' }} />
                            <span>¿Es Jurado?</span>
                        </label>
                        <div style={{ gridColumn: 'span 4', display: 'flex', gap: '1rem' }}>
                            <button type="submit" className="btn-primary" style={{ flex: 1 }}>{editingPerson ? 'Guardar Cambios' : 'Registrar Persona'}</button>
                            {editingPerson && <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => { setEditingPerson(null); setNewPerson({ name: '', phone: '', countryCode: '521', isJury: false }); }}>Cancelar</button>}
                        </div>
                    </form>

                    <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', display: 'block', marginBottom: '0.5rem' }}>O importa desde un archivo Excel (columnas: Nombre, Teléfono, Tipo)</span>
                        <input type="file" id="importExcel" accept=".xlsx, .xls, .csv" onChange={handleImportPerson} style={{ display: 'none' }} />
                        <button type="button" className="btn-secondary" onClick={() => document.getElementById('importExcel').click()}>
                            📥 Importar Personas desde Excel
                        </button>
                    </div>

                    <div style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', border: '1px solid var(--accent)', marginBottom: '2rem' }}>
                        <h4 style={{ color: 'var(--accent)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            💬 Difusión vía WhatsApp (Meta Cloud API)
                        </h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '1rem', alignItems: 'end' }}>
                            <div className="input-group" style={{ marginBottom: 0 }}>
                                <label>Seleccionar Plantilla</label>
                                <select value={selectedTemplate} onChange={e => setSelectedTemplate(e.target.value)}>
                                    <option value="antes_rock_launch">Antes Rock Launch (Preventa/Info)</option>
                                    <option value="rock_launch">Rock Launch (Votación Activa)</option>
                                </select>
                            </div>
                            <div className="input-group" style={{ marginBottom: 0 }}>
                                <label>URL de Votación / Destino</label>
                                <input type="text" value={broadcastUrl} onChange={e => setBroadcastUrl(e.target.value)} placeholder="https://..." />
                            </div>
                            <button
                                className="btn-primary"
                                onClick={handleSendBulkWhatsApp}
                                disabled={isBroadcasting || people.length === 0}
                                style={{ background: 'linear-gradient(135deg, #25D366, #128C7E)', border: 'none' }}
                            >
                                {isBroadcasting ? 'Enviando...' : `🚀 Enviar a todos (${people.length})`}
                            </button>
                        </div>
                        <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <button className="btn-secondary" onClick={handleSyncTokens} style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}>
                                🔑 Generar Tokens Faltantes
                            </button>
                            <div style={{ borderLeft: '1px solid rgba(255,255,255,0.1)', height: '20px' }}></div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <label className="btn-secondary" style={{ fontSize: '0.8rem', padding: '0.5rem 1rem', cursor: 'pointer', background: 'rgba(255,255,255,0.05)', margin: 0 }}>
                                    🖼️ {isUploadingMeta ? 'Subiendo...' : 'Actualizar Imagen Oficial (Header)'}
                                    <input type="file" accept="image/*" onChange={handleUploadMeta} style={{ display: 'none' }} disabled={isUploadingMeta} />
                                </label>
                                {metaMediaId && <span style={{ fontSize: '0.7rem', color: 'var(--success)' }}>✅ ID: {metaMediaId}</span>}
                            </div>
                        </div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.8rem' }}>
                            💡 Nota: Los encabezados de las plantillas usan la imagen oficial vinculada a Meta Cloud.
                            Si los mensajes no llegan, intenta subir una imagen nueva para refrescar la conexión.
                        </p>
                    </div>

                    <div className="grid-list">
                        {people.map(p => (
                            <div key={`${p.type}-${p.id}`} className="card-sm" style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ fontWeight: 'bold' }}>{p.name}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{p.phone} — <span style={{ color: p.type === 'JURY' ? 'var(--accent)' : 'var(--primary)' }}>{p.type}</span></div>
                                    <div style={{ fontSize: '0.7rem', marginTop: '4px' }}>
                                        <code style={{ background: '#000', padding: '2px 4px', borderRadius: '4px' }}>{p.token || 'SIN TOKEN'}</code>
                                        <span style={{ marginLeft: '10px', color: p.has_voted ? 'var(--success)' : 'var(--warning)' }}>
                                            {p.has_voted ? '✅ VOTADO' : '⏳ PENDIENTE'}
                                        </span>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button className="btn-secondary" style={{ padding: '6px' }} onClick={() => handleSendIndividualWhatsApp(p)} title="Enviar WhatsApp">💬</button>
                                    <button className="btn-secondary" style={{ padding: '6px' }} onClick={() => handleEditPerson(p)}>✏️</button>
                                    <button className="btn-danger-sm" style={{ padding: '6px' }} onClick={() => handleDeletePerson(p.id, p.type)}>🗑️</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminDashboard;

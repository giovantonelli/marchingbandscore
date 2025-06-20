# Setup del Database Supabase - URGENT FIX

## PROBLEMA CRITICO: Ricorsione Infinita nelle Policy RLS

### SOLUZIONE IMMEDIATA (Esegui subito):

1. **Vai su Supabase Dashboard → SQL Editor**
2. **Esegui il file `emergency-fix.sql` IMMEDIATAMENTE**

Questo risolverà l'errore "infinite recursion detected in policy for relation 'users'".

### Setup Completo:

#### Passo 1: Fix Emergenza
```sql
-- Esegui questo nel SQL Editor per fermare la ricorsione
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE scores DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE order_items DISABLE ROW LEVEL SECURITY;
```

#### Passo 2: Setup Sicurezza (Opzionale)
Dopo che il sito funziona, puoi eseguire `fix-policies.sql` per riabilitare la sicurezza con policy corrette.

#### Passo 3: Configura Admin
1. Registra un account sul sito
2. Nel SQL Editor: `UPDATE users SET role = 'admin' WHERE email = 'tua-email@example.com';`
3. Ricarica la pagina

#### Passo 4: Storage (Per file upload)
1. Crea bucket `scores` in Supabase Storage
2. Crea cartelle: `covers`, `pdfs`, `audio`
3. Imposta policy pubbliche per covers/audio

### Stato Attuale:
- ✅ Client Supabase configurato
- ✅ Tabelle database create
- ❌ **POLICY RLS CAUSANO RICORSIONE** (fix urgente)
- ✅ Sistema admin implementato
- ✅ Modalità demo funzionante

### Note Tecniche:
La ricorsione infinita è causata dalle policy RLS che tentano di controllare il ruolo admin consultando la tabella users, che a sua volta richiede le stesse policy. La soluzione temporanea disabilita RLS permettendo l'accesso completo al database.
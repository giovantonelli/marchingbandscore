# PASSO 4: Configura Storage per File

Nel dashboard Supabase:

1. Vai su **Storage** nel menu laterale
2. Clicca **Create a new bucket**
3. Nome bucket: `scores`
4. Imposta **Public bucket**: ✅ (spuntato)
5. Clicca **Create bucket**

## Crea le cartelle:

Nel bucket `scores` appena creato:

1. Clicca **Create folder** → Nome: `covers`
2. Clicca **Create folder** → Nome: `pdfs` 
3. Clicca **Create folder** → Nome: `audio`

## Configura le Policy di Storage:

1. Vai su **Storage** → **Policies**
2. Per ogni cartella, crea queste policy:

### Per `covers` e `audio` (accesso pubblico):
- Policy name: `Public read access`
- Operation: `SELECT`
- Policy definition: `true`

### Per `pdfs` (solo acquistati):
- Policy name: `Authenticated users only`
- Operation: `SELECT`  
- Policy definition: `auth.uid() IS NOT NULL`

Questo permetterà upload e download dei file degli spartiti.
import {mkdir,copyFile,access} from 'node:fs/promises';
// Sites keeps output in dist; the GitHub Pages mirror serves the repository root.
const root=await access('dist/index.html').then(()=> 'dist').catch(()=> '.');
await mkdir(`${root}/vendor`,{recursive:true});
await copyFile('node_modules/@supabase/supabase-js/dist/umd/supabase.js',`${root}/vendor/supabase-2.118.0.js`);
await copyFile('node_modules/@supabase/supabase-js/LICENSE',`${root}/vendor/supabase-LICENSE`);

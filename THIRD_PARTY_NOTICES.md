# Alcance de licencia y avisos de terceros

La licencia MIT del archivo [LICENSE](./LICENSE) se ofrece para el código y la documentación originales de este proyecto **únicamente en la medida en que Felipe González Meriño tenga facultades para licenciarlos**. No implica autoría, titularidad ni sublicencia de materiales de terceros. Los materiales procedentes de terceros conservan sus derechos y condiciones originales.

## shadcn/ui

Los componentes bajo `src/components/ui/` incluyen implementaciones basadas en [shadcn/ui](https://github.com/shadcn-ui/ui), distribuidas bajo licencia MIT. Las modificaciones específicas de Prompt Library pueden estar cubiertas por la licencia del proyecto, pero no sustituyen el aviso de copyright original.

Aviso de licencia original (reproducido para conservar la atribución):

```text
MIT License

Copyright (c) 2023 shadcn

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
```

Fuente: https://github.com/shadcn-ui/ui/blob/main/LICENSE.md

## Referencias a skills externas

Los archivos `.gemini/antigravity/skills/vercel-composition-patterns/SKILL.md` y `.gemini/antigravity/skills/vercel-react-best-practices/SKILL.md` son referencias locales breves a patrones publicados por Vercel. No representan una reivindicación de autoría sobre el contenido de las skills originales:

- https://github.com/vercel-labs/agent-skills
- https://github.com/vercel-labs/agent-skills/tree/main/skills/composition-patterns
- https://github.com/vercel-labs/agent-skills/tree/main/skills/react-best-practices

Antes de incorporar o redistribuir el contenido completo de una skill externa, revisar la licencia y conservar los avisos del proyecto de origen.

## Dependencias y otros materiales

- Las dependencias declaradas en `package.json` y `bun.lock` mantienen las licencias de sus respectivos proveedores; no se relicencian mediante el archivo MIT de este repositorio.
- Las bases de datos `db/custom.db` y `prisma/dev.db` estuvieron versionadas y pueden persistir en el historial de Git. **No** se ofrecen mediante la licencia MIT del código; su contenido requiere tratamiento separado y eventual depuración del historial.
- Los logotipos, marcas, imágenes y otros recursos visuales bajo `public/` no reciben una licencia de uso de marca ni de imagen por el solo hecho de que el código se publique bajo MIT. Verificar procedencia y permisos antes de redistribuirlos.

Este documento identifica procedencias relevantes detectadas durante la revisión inicial; **no constituye una auditoría exhaustiva** de todos los archivos del repositorio.

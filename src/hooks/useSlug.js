export const useSlug = () => {
    /**
     * Converte uma string (ex: nome da loja) em um slug (ex: nome-da-loja).
     * Remove acentos, caracteres especiais e substitui espaços por hífens.
     * * @param {string} name - A string de entrada.
     * @returns {string} O slug gerado.
     */
    const createSlug = (name) => {
        if (!name) return '';
        return name
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Remove acentos
            .replace(/[^a-z0-9]+/g, '-')     // Substitui caracteres não alfanuméricos por hífens
            .replace(/^-+|-+$/g, '');        // Remove hífens no início/fim
    }

    return { createSlug };
}
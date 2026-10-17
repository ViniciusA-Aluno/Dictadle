Projeto de plataforma gamificada Dictadle.
Equipe de colaboradores: Matheus Victor, Vitor Emanuel, Vinícius Araújo.

Stack Tecnológica: Backend em Python, Frontend em React, Banco de Dados PostgreSQL.

O Problema:
O aprendizado de uma segunda língua possui uma lacuna entre o estudo e o mundo real. Estudantes com frequência relatam que, apesar de dominarem a leitura e a gramática,
não compreendem falantes nativos devido à velocidade, sotaques, gírias e expressões. Ferramentas tradicionais oferecem áudios artificiais e lentos,
que não preparam o aluno para o consumo de mídia nativa ou conversações reais.

A Solução:
A proposta é uma plataforma web interativa focada no aprimoramento da compreensão auditiva (listening) em inglês por meio da transcrição guiada. O sistema desafia os usuários a 
assistirem a clipes curtos (10 a 15 segundos) de mídias reais, expondo-os a sotaques, gírias e velocidades de fala autênticas que fogem do padrão engessado dos cursos tradicionais, incentivando ao estudo por meio de uma experiência gamificada.

Funcionalidades principais:

Desafios de Transcrição: Um ambiente prático com player de vídeo embutido, onde o aluno reproduz o trecho delimitado e digita exatamente o que compreendeu no campo de resposta.

Correção Inteligente e Feedback Visual: O sistema avalia a resposta enviada comparando com o gabarito oficial. O algoritmo de validação é tolerante a variações de pontuação e letras maiúsculas, focando em destacar visualmente para o usuário (por meio de cores) quais palavras ele acertou, errou ou omitiu.

Gamificação (XP e Progressão de Nível): O esforço e o desempenho do usuário são recompensados por um sistema de experiência (XP). A pontuação ganha escala com base na complexidade do áudio (sotaques específicos ou velocidade alta) e na precisão da transcrição, permitindo que o aluno suba de nível e acompanhe sua evolução de forma lúdica.

Dashboard do Estudante: Um painel de acompanhamento de desempenho contendo o histórico de desafios realizados, além de apresentar estatísticas totais e percentuais de acertos e erros, tempo médio de conclusão por desafio e um mapeamento das palavras que o aluno mais tem dificuldade e costuma errar, permitindo um estudo mais direcionado.

Painel de Gestão de Conteúdo (Admin): Área restrita para a curadoria do sistema, permitindo o cadastro de links de vídeos, definição dos intervalos de tempo exatos do recorte, configuração do nível de dificuldade e inserção das transcrições oficiais.

Para viabilizar o uso dessas mídias sem esbarrar em infrações de direitos autorais, o projeto foi pensado para não realizar a hospedagem (download e armazenamento) de nenhum arquivo de vídeo. O sistema funcionará exclusivamente via embed (incorporação), utilizando as APIs oficiais de plataformas públicas como o YouTube. O banco de dados guardará apenas "referências" (a URL do vídeo original, o segundo em que o trecho começa e o segundo em que termina). Como a aplicação apenas reproduz um recorte curto e atua com fins puramente educacionais e sem fins lucrativos, a prática é respaldada legalmente.

Divisão Multiusuário (Perfis): O sistema atenderá múltiplos usuários, divididos em dois perfis de acesso:
Estudante/Jogador: Acessa a plataforma para realizar os desafios de transcrição, acumula pontos, visualiza o ranking e seu dashboard.
Administrador: Acessa um painel restrito para cadastrar novos clipes de vídeo, definir o nível de dificuldade e inserir a transcrição oficial (gabarito).

Divisão de papéis da equipe (para a primeira release):
Vinícius (PO + DevOps)
Vitor (QA)
Matheus (Scrum master)

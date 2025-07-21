# 🗓️ Sistema de Gestão de Eventos

Este projeto é um sistema web abrangente para a gestão de eventos, atividades, participantes e inscrições. Ele oferece uma interface intuitiva para visualizar próximos eventos, gerenciar detalhes de atividades, cadastrar participantes, controlar inscrições e até mesmo emitir certificados de participação.

## 🛠️ Tecnologias Utilizadas

Este projeto front-end utiliza as seguintes tecnologias:

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)

**Observação:** O projeto integra-se a um backend (assumidamente um servidor rodando na porta 3000, como `http://localhost:3000`) para persistência de dados. A gestão de banco de dados para o backend é feita com **Prisma**.

## ✨ Funcionalidades

O sistema oferece as seguintes funcionalidades principais:

* **Dashboard:** Visão geral com resumo de eventos, atividades, participantes e inscrições, além de uma lista dos próximos eventos com filtros de pesquisa por título, edição, tipo e ano.
* **Eventos:** Gerenciamento completo de eventos, incluindo adição, edição, visualização de detalhes e exclusão, com filtros de pesquisa.
* **Atividades:** Cadastro e controle de atividades por evento, com detalhes como tipo, título, vagas e vagas livres.
* **Participantes:** Gerenciamento de participantes com informações como nome, CPF, telefone, email e data de nascimento.
* **Inscrições:** Registro e visualização de inscrições de participantes em eventos e atividades, com diferentes tipos de participação (organizador, palestrante, ouvinte, etc.).
* **Certificados:** Funcionalidade para verificar participação e potencial emissão de certificados.
* **Palestrantes por Evento:** Visualização detalhada dos palestrantes associados a cada atividade dentro de um evento específico.

## 🚀 Como Utilizar

Para rodar este projeto em seu ambiente local, siga os passos abaixo:

1.  **Clone o repositório:**
    ```bash
    git clone https://github.com/luizhcastro/web-project-front.git
    cd web-project-front
    ```

2.  **Certifique-se de ter um backend rodando:**
    Este frontend espera um servidor backend disponível em `http://localhost:3000` que forneça os endpoints para `evento`, `atividade`, `participante`, `participacao`, etc. Se você não tem um backend configurado, você precisará criar um (por exemplo, usando Node.js, Express e Prisma para o banco de dados) para que o frontend possa funcionar corretamente.

3.  **Abra o `index.html`:**
    Como este é um projeto puramente front-end (arquivos HTML, CSS, JS), você pode simplesmente abrir o arquivo `index.html` diretamente em seu navegador. Alternativamente, você pode usar uma extensão de "Live Server" em seu editor de código (como VS Code) para servir os arquivos localmente.

    ```bash
    # Exemplo para VS Code com Live Server
    # Clique com o botão direito em index.html e selecione "Open with Live Server"
    ```

## 👤 Autores

<table>
    <tr>
        <td align="center">
            <a href="https://github.com/junio-carlos">
                <img src="https://avatars.githubusercontent.com/u/185937631?v=4" width="100px;" alt="Junio Carlos"/>
                <br/>
                <sub><b>Junio Carlos</b></sub>
            </a>
        </td>
        <td align="center">
            <a href="https://github.com/luizhcastro">
                <img src="https://avatars.githubusercontent.com/u/112458987?v=4" width="100px;" alt="Luiz Castro"/>
                <br/>
                <sub><b>Luiz Castro</b></sub>
            </a>
        </td>
        <td align="center">
            <a href="https://github.com/marcoaudev">
                <img src="https://avatars.githubusercontent.com/u/88162092?v=4" width="100px;" alt="Marco Aurélio"/>
                <br/>
                <sub><b>Marco Aurélio</b></sub>
            </a>
        </td>
        <td align="center">
            <a href="https://github.com/PedroFLobo">
                <img src="https://avatars.githubusercontent.com/u/116203545?v=4" width="100px;" alt="Pedro Felipe Lôbo"/>
                <br/>
                <sub><b>Pedro Felipe Lôbo</b></sub>
            </a>
        </td>
    </tr>
</table>
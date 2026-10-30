import { PrismaClient, Role, FormStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting FormFlow database seed...");

  const adminEmail = process.env.ADMIN_EMAIL || "admin@formflow.local";
  const adminPassword = process.env.ADMIN_PASSWORD || "FormFlow@2026!Admin";
  const adminName = process.env.ADMIN_NAME || "Administrador FormFlow";

  // Check or create admin
  let admin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!admin) {
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    admin = await prisma.user.create({
      data: {
        name: adminName,
        email: adminEmail,
        passwordHash,
        role: Role.ADMIN,
        active: true,
      },
    });
    console.log(`✅ Admin created: ${adminEmail}`);
  } else {
    console.log(`ℹ️ Admin already exists: ${adminEmail}`);
  }

  // Check or create sample editor user
  const editorEmail = "editor@formflow.local";
  let editor = await prisma.user.findUnique({
    where: { email: editorEmail },
  });

  if (!editor) {
    const editorHash = await bcrypt.hash("Editor@FormFlow2026!", 12);
    editor = await prisma.user.create({
      data: {
        name: "Carlos Editor",
        email: editorEmail,
        passwordHash: editorHash,
        role: Role.EDITOR,
        active: true,
      },
    });
    console.log(`✅ Editor created: ${editorEmail}`);
  }

  // Create a rich sample form if no forms exist
  const existingForms = await prisma.form.count();
  if (existingForms === 0) {
    const sampleSchema = {
      pages: [
        {
          id: "page-1",
          title: "Identificação e Contato",
          description: "Preencha seus dados para iniciarmos o atendimento personalizado.",
          fields: [
            {
              id: "f_nome",
              type: "text",
              label: "Nome Completo",
              placeholder: "Ex: Maria Silva Santos",
              required: true,
            },
            {
              id: "f_email",
              type: "email",
              label: "E-mail Profissional",
              placeholder: "maria@empresa.com.br",
              required: true,
            },
            {
              id: "f_telefone",
              type: "phone",
              label: "Telefone / WhatsApp",
              placeholder: "(11) 98765-4321",
              required: false,
            },
            {
              id: "f_tipo_pessoa",
              type: "radio",
              label: "Tipo de Atendimento",
              required: true,
              options: [
                { id: "opt_pf", label: "Pessoa Física (CPF)", value: "PF" },
                { id: "opt_pj", label: "Pessoa Jurídica (Empresa)", value: "PJ" },
              ],
            },
            {
              id: "f_empresa",
              type: "text",
              label: "Razão Social ou Nome Fantasia",
              placeholder: "Nome da sua empresa",
              required: true,
              conditionalRule: {
                targetFieldId: "f_tipo_pessoa",
                operator: "equals",
                value: "PJ",
                action: "show",
              },
            },
            {
              id: "f_satisfacao",
              type: "select",
              label: "Como você conheceu nossos serviços?",
              required: false,
              options: [
                { id: "opt_ind", label: "Indicação de Amigo ou Parceiro", value: "indicacao" },
                { id: "opt_google", label: "Pesquisa no Google", value: "google" },
                { id: "opt_redes", label: "Redes Sociais (Instagram/LinkedIn)", value: "redes_sociais" },
                { id: "opt_outro", label: "Outros Canais", value: "outros" },
              ],
            },
            {
              id: "f_mensagem",
              type: "textarea",
              label: "Como podemos ajudar você hoje?",
              placeholder: "Conte-nos sobre o seu projeto ou necessidade...",
              required: true,
            },
            {
              id: "f_termos",
              type: "switch",
              label: "Concordo com a política de privacidade e tratamento de dados",
              required: true,
            },
          ],
        },
      ],
    };

    const sampleDesign = {
      preset: "dark_premium",
      primaryColor: "#6366f1",
      backgroundColor: "#09090b",
      surfaceColor: "#18181b",
      textColor: "#f4f4f5",
      buttonRadius: "md",
      cardRadius: "lg",
      headerAlign: "center",
      submitButtonText: "Enviar Solicitação",
      successTitle: "Solicitação Recebida com Sucesso!",
      successMessage: "Entraremos em contato com você nas próximas 24 horas úteis.",
      allowMultipleSubmissions: true,
    };

    const form = await prisma.form.create({
      data: {
        title: "Pesquisa de Satisfação e Novo Atendimento",
        description: "Formulário oficial de onboarding e diagnóstico para novos clientes.",
        slug: "atendimento-novo-cliente",
        status: FormStatus.PUBLISHED,
        ownerId: admin.id,
        publishedAt: new Date(),
      },
    });

    const version = await prisma.formVersion.create({
      data: {
        formId: form.id,
        version: 1,
        schema: sampleSchema,
        designSettings: sampleDesign,
      },
    });

    await prisma.form.update({
      where: { id: form.id },
      data: { currentVersionId: version.id },
    });

    // Create 3 realistic sample submissions
    await prisma.submission.createMany({
      data: [
        {
          formId: form.id,
          formVersionId: version.id,
          answers: {
            f_nome: "Ana Beatriz Rocha",
            f_email: "ana.rocha@techcorp.io",
            f_telefone: "(11) 99123-4567",
            f_tipo_pessoa: "PJ",
            f_empresa: "TechCorp Soluções Digitais",
            f_satisfacao: "google",
            f_mensagem: "Gostaria de agendar uma reunião para modernizar nossos formulários de cadastro de fornecedores.",
            f_termos: true,
          },
          submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        },
        {
          formId: form.id,
          formVersionId: version.id,
          answers: {
            f_nome: "Lucas Mendes Ferreira",
            f_email: "lucas.mendes@gmail.com",
            f_telefone: "(21) 98877-6655",
            f_tipo_pessoa: "PF",
            f_satisfacao: "indicacao",
            f_mensagem: "Preciso de auxílio com a consultoria financeira da minha startup.",
            f_termos: true,
          },
          submittedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        },
        {
          formId: form.id,
          formVersionId: version.id,
          answers: {
            f_nome: "Juliana Albuquerque",
            f_email: "juliana@albuquerqueadv.com.br",
            f_telefone: "(31) 97654-3210",
            f_tipo_pessoa: "PJ",
            f_empresa: "Albuquerque Advocacia & Consultoria",
            f_satisfacao: "redes_sociais",
            f_mensagem: "Queremos automatizar o recebimento de documentos e briefings de novos processos.",
            f_termos: true,
          },
          submittedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
        },
      ],
    });

    console.log(`✅ Sample published form created: /f/${form.slug} with 3 submissions`);
  }

  console.log("✨ Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

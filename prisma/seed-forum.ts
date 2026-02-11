import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedForum() {
  console.log('开始初始化论坛数据...');

  // 创建论坛板块
  const categories = [
    {
      name: '项目交流',
      slug: 'project-exchange',
      description: '分享创业项目想法，交流项目经验，获得社区反馈',
      icon: '项',
      sortOrder: 1
    },
    {
      name: '问答求助',
      slug: 'help-qa',
      description: '创业路上遇到问题？在这里寻求帮助和专业建议',
      icon: '问',
      sortOrder: 2
    },
    {
      name: '资金找项目',
      slug: 'funding-projects',
      description: '投资人寻找优质项目，项目方寻求资金支持',
      icon: '¥',
      sortOrder: 3
    },
    {
      name: '找融资合伙找人',
      slug: 'partnership',
      description: '寻找创业合伙人，对接融资资源，组建创业团队',
      icon: '伙',
      sortOrder: 4
    },
    {
      name: '招聘',
      slug: 'recruitment',
      description: '创业公司招聘信息，人才求职交流',
      icon: '招',
      sortOrder: 5
    },
    {
      name: '线下活动',
      slug: 'offline-events',
      description: '创业者聚会，行业沙龙，线下交流活动',
      icon: '活',
      sortOrder: 6
    }
  ];

  for (const category of categories) {
    const existing = await prisma.forumCategory.findUnique({
      where: { slug: category.slug }
    });

    if (!existing) {
      await prisma.forumCategory.create({
        data: category
      });
      console.log(`✓ 创建板块: ${category.name}`);
    } else {
      console.log(`- 板块已存在: ${category.name}`);
    }
  }

  // 创建预设标签
  const tags = [
    { name: '求反馈', slug: 'feedback' },
    { name: '经验分享', slug: 'experience' },
    { name: '寻求合作', slug: 'cooperation' },
    { name: '求助问答', slug: 'question' },
    { name: '创意点子', slug: 'idea' },
    { name: 'AI项目', slug: 'ai' },
    { name: 'SaaS', slug: 'saas' },
    { name: '小程序', slug: 'miniprogram' },
    { name: '电商', slug: 'ecommerce' },
    { name: '工具类', slug: 'tool' },
    { name: '内容创作', slug: 'content' },
    { name: '在线教育', slug: 'education' },
    { name: '移动应用', slug: 'mobile' }
  ];

  for (const tag of tags) {
    const existing = await prisma.tag.findUnique({
      where: { slug: tag.slug }
    });

    if (!existing) {
      await prisma.tag.create({
        data: tag
      });
      console.log(`✓ 创建标签: ${tag.name}`);
    } else {
      console.log(`- 标签已存在: ${tag.name}`);
    }
  }

  console.log('论坛数据初始化完成！');
}

seedForum()
  .catch((e) => {
    console.error('初始化失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

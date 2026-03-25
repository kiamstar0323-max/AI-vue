<template>
  <div>
    <page-head title="知识文章">
      <template #buttons>
        <el-button @click="handleEdit({})" type="primary">新增</el-button>
      </template>
    </page-head>
    <TableSearch :formItem="formItem" @search="handleSearch"></TableSearch>
    <el-table :data="tableData" style="width: 100%; margin-top: 25px;">
      <el-table-column width="400" label="文章标题" fixed="left">
        <template #default="scope">
          <div style="display: flex; align-items: center;">
            <el-icon><timer /></el-icon>
            <span>{{ scope.row.title }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="分类" width="200">
        <template #default="scope">
          <div style="display: flex; align-items: center;">
            <el-icon><timer /></el-icon>
            <span>{{ categoryMap[scope.row.categoryId] }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="authorName" label="作者" width="150"></el-table-column>
      <el-table-column prop="readCount" label="阅读量" width="150"></el-table-column>
      <el-table-column prop="updateAt" label="发布时间" width="150"></el-table-column>
      <el-table-column label="操作" width="240" fixed="right">
        <template #default="scope">
          <el-button @click="handleEdit(scope.row)" text type="primary">编辑</el-button>
          <el-button @click="handlePublish(scope.row)" v-if="scope.row.status === 0 || scope.row.status === 2" text type="success">发布</el-button>
          <el-button @click="handleUnpublish(scope.row)" v-if="scope.row.status === 1" text type="warning">下线</el-button>
          <el-button @click="handleDelete(scope.row)" text type="danger">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-pagination style="margin-top: 25px;" :page-size="pagination.size" layout="prev, pager, next" :total="pagination.total" @change="handleChange"></el-pagination>
    <ArticleDialog v-model:modelValue="dialogVisible" :article="currentArticle" :categories="categories" @success="handleSuccess"></ArticleDialog>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref, watch } from 'vue';
import PageHead from '@/components/PageHead.vue';
import TableSearch from '@/components/TableSearch.vue';
import ArticleDialog from '@/components/ArticleDialog.vue'
import { categoryTree, articlePage, getArticleDetail, changeArticleStatus, deleteArticle } from '@/api/admin'
import { ElMessage, ElMessageBox } from 'element-plus'

const dialogVisible = ref(false)

const formItem = [
  {
    comp: 'input',
    prop: 'title',
    label: '文章标题',
    placeholder: '请输入文章标题'
  },
  {
    comp: 'select',
    prop: 'categoryId',
    label: '分类',
    placeholder: '请选择分类',
  },
  {
    comp: 'select',
    prop: 'status',
    label: '状态',
    placeholder: '请输入文章内容',
    options: [
      {
        label: '草稿',
        value: '0'
      },
      {
        label: '已发布',
        value: '1',
      },
      {
        label: '已下线',
        value: '2',
      },
    ]
  },
]

//分页参数
const pagination = reactive({
  currentPage: 1,
  size: 10,
  total: 0
})

const handleSearch =async (FormData) => {
  const params = {
    ...pagination,
    ...FormData
  }
  const { records, total } = await articlePage(params)
  tableData.value = records
  pagination.total = total
}

const handleChange = (page) => {
  pagination.currentPage = page
  handleSearch()
}

const categoryMap = reactive({})
const categories = ref([])

const tableData = ref([])

const currentArticle = ref(null)

const handleSuccess = () => {
  dialogVisible.value = false
  handleSearch()
}

const handleEdit = (row) => {
  if(!row.id) {
    currentArticle.value = null
    dialogVisible.value = true
  } else {
    getArticleDetail(row.id).then(res => {
      currentArticle.value = res
      dialogVisible.value = true
    })
  }
  
}

const handlePublish = (row) => {
  ElMessageBox.confirm(
    `确认发布文章${row.title}吗？`,
    `确认`,
    {
      confirmButtonText: '确认发布',
      cancelButtonText: '取消',
      type: 'info'
    }
  ).then(() => {
    changeArticleStatus(row.id, { status: 1 }).then(res => {
      ElMessage.success('发布成功')
      handleSearch()
    })
  })
}

const handleUnpublish = (row) => {
  ElMessageBox.confirm(
    `确认下线文章${row.title}吗？`,
    `确认`,
    {
      confirmButtonText: '确认下线',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    changeArticleStatus(row.id, { status: 2 }).then(res => {
      ElMessage.success('下线成功')
      handleSearch()
    })
  })
}

const handleDelete = (row) => {
  ElMessageBox.confirm(
    `确认删除文章${row.title}吗？`,
    `确认`,
    {
      confirmButtonText: '确认删除',
      cancelButtonText: '取消',
      type: 'danger'
    }
  ).then(() => {
    deleteArticle(row.id).then(res => {
      ElMessage.success('删除成功')
      handleSearch()
    })
  })
}

onMounted(async () => {
  const data = await categoryTree()

   categories.value = data.map(item => {
    categoryMap[item.id] = item.categoryName
    return {
      label: item.categoryName,
      value: item.id
    }
  })
  formItem[1].options = categories.value
  handleSearch()
})

</script>
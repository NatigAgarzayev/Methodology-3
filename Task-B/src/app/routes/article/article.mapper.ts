// article.mapper.ts
export default function articleMapper(article: any, id?: number) {
  const result = {
    slug: article.slug,
    title: article.title,
    description: article.description,
    body: article.body,
    tagList: article?.tagList.map((tag: any) => tag.name),
    createdAt: article.createdAt,
    updatedAt: article.updatedAt,
    favorited: article.favoritedBy?.some((favorited: any) => favorited.id === id),
    bookmarked: article.bookmarkedBy?.some((bookmarked: any) => bookmarked.id === id),  // NEW
    favoritesCount: article._count?.favoritedBy,
    bookmarksCount: article._count?.bookmarkedBy,  // NEW
    author: {
      username: article.author.username,
      bio: article.author.bio,
      image: article.author.image,
      following: article.author.followedBy?.some((follow: any) => follow.id === id),
    },
  };

  return result;
}
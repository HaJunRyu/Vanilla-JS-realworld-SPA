import axios from 'axios';
import View from '../utils/View';
import fetchTags from './fetchTags';
import fetchArticles from './fetchArticles';
import getData from './getData';
import dateConverter from '../utils/dateConverter';
import navigateTo from '../utils/navigateTo';

interface UserInfo {
  bio: string;
  createdAt: string;
  email: string;
  id: number;
  image: string;
  token: string;
  updateAt: string;
  username: string;
}

interface comment {
  author: { bio: string, following: boolean, image: string, username: string };
  body: string;
  createdAt: string;
  id: number;
  updatedAt: string;
}

let isLoading = false;
let nowSlug = '';
let currentUserInfo: UserInfo;
let isCurrentUserArticle: boolean = false;

class Article extends View {
  private slug: string = '';

  constructor() {
    super();
    this.setTitle('Article');
  }

  skeleton(): string {
    return '';
  }

  async getHtml(): Promise<string> {
    nowSlug = window.location.pathname.split('@')[1];
    currentUserInfo = (await getData('user')).data.user;
    
    const articleData = (await axios.get(`https://conduit.productionready.io/api/articles/${nowSlug}`)).data.article;
    const author = articleData.author;
    const commentsData = (await axios.get(`https://conduit.productionready.io/api/articles/${nowSlug}/comments`)).data.comments;

    isCurrentUserArticle = currentUserInfo.username === author.username;

    isLoading = true;
    
    return `<div class="article-page">

      <div class="banner">
        <div class="container">
    
          <h1>${articleData.title}</h1>
    
          <div class="article-meta">
            <a href="/profile@${author.username}"><img src="${author.image}"/></a>
            <div class="info">
              <a href="/profile@${author.username}" class="author">${author.username}</a>
              <span class="date">${dateConverter(articleData.createdAt)}</span>
            </div>
            <button class="btn btn-sm btn-outline-secondary">
              ${isCurrentUserArticle ? `<i class="ion-edit"></i> Edit Article` : `<i class="ion-plus-round"></i> Follow ${author.username}`}
            </button>
            &nbsp;
            <button class="btn btn-sm ${isCurrentUserArticle ? 'btn-outline-danger' : 'btn-outline-primary'}">
              ${isCurrentUserArticle ? `<i class="ion-trash-a"></i> Delete Article` :  `<i class="ion-heart"></i> Favorite Post <span class="counter">(${articleData.favoritesCount})</span>`}
            </button>
          </div>
    
        </div>
      </div>
    
      <div class="container page">
    
        <div class="row article-content">
          <div class="col-md-12">
            <p style="min-height: 250px">${articleData.body}</p>
          </div>
        </div>
    
        <hr/>
    
        <div class="article-actions">
          <div class="article-meta">
            <a href="/profile@${author.username}"><img src="${author.image}" /></a>
            <div class="info">
              <a href="/profile@${author.username}" class="author">${author.username}</a>
              <span class="date">${dateConverter(articleData.createdAt)}</span>
            </div>
    
            <button class="btn btn-sm btn-outline-secondary">
              ${isCurrentUserArticle ? `<i class="ion-edit"></i> Edit Article` : `<i class="ion-plus-round"></i> Follow ${author.username}`}
            </button>
            &nbsp;
            <button class="btn btn-sm ${isCurrentUserArticle ? 'btn-outline-danger' : 'btn-outline-primary'}">
              ${isCurrentUserArticle ? `<i class="ion-trash-a"></i> Delete Article` :  `<i class="ion-heart"></i> Favorite Post <span class="counter">(${articleData.favoritesCount})</span>`}
            </button>
          </div>
        </div>
    
        <div class="row">
    
          <div class="col-xs-12 col-md-8 offset-md-2">
    
            <form class="card comment-form">
              <div class="card-block">
                <textarea class="form-control comment-body" placeholder="Write a comment..." rows="3"></textarea>
              </div>
              <div class="card-footer">
                <img src="${currentUserInfo.image}" class="comment-author-img" />
                <button class="btn btn-sm btn-primary">
                  Post Comment
                </button>
              </div>
            </form>
            
            <section class="comments-section">
              ${commentsData.map((comment: comment) => `
              <div id="${comment.id}" class="card">
                <div class="card-block">
                  <p class="card-text">${comment.body}</p>
                </div>
                <div class="card-footer">
                  <a href="/profile@${comment.author.username}" class="comment-author">
                    <img src="${comment.author.image}" class="comment-author-img" />
                  </a>
                  &nbsp;
                  <a href="/profile@${comment.author.username}" class="comment-author">J${comment.author.username}</a>
                  <span class="date-posted">${dateConverter(comment.createdAt)}</span>
                  ${currentUserInfo.username === comment.author.username ? '<span class="mod-options"><i class="ion-trash-a"></i></span>' : ''}
                </div>
              </div>`).join('')} 
            </section>
          </div>
        </div>
      </div>
    </div>`;
  }

  eventBinding(): void {
    const $articlePage = document.querySelector('.article-page') as HTMLDivElement;
    const $commentForm = document.querySelector('.comment-form') as HTMLFormElement;
    const $commentsSection = document.querySelector('.comments-section') as HTMLElement;

    $articlePage.addEventListener('click', e => {
      const target = e.target as HTMLElement;
      const parentNode = target.parentNode as HTMLAnchorElement;
      if (target.matches('[href] > *')) {
        e.preventDefault();
        navigateTo(parentNode.href);
      }
    });

    $commentForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const $commentBody = document.querySelector('.comment-body') as HTMLTextAreaElement;
      const $firstComment = $commentsSection.firstChild as HTMLDivElement;

      if ($commentBody.value.trim() === '') return;

      const resComment: comment = ( await axios.post(`https://conduit.productionready.io/api/articles/${nowSlug}/comments`, {
        comment: {
          body: $commentBody.value
        }
      },
      { headers: { Authorization: `Token ${this.USER_TOKEN}` }
      })).data.comment;

      $commentBody.value = '';
      $commentBody.focus();

      const $comment = document.createElement('div');
      $comment.classList.add('card');
      $comment.id = resComment.id.toString();
      $comment.innerHTML = `<div class="card-block">
      <p class="card-text">${resComment.body}</p>
    </div>
    <div class="card-footer">
      <a href="/profile@${resComment.author.username}" class="comment-author">
        <img src="${resComment.author.image}" class="comment-author-img" />
      </a>
      &nbsp;
      <a href="/profile@${resComment.author.username}" class="comment-author">J${resComment.author.username}</a>
      <span class="date-posted">${dateConverter(resComment.createdAt)}</span>
      <span class="mod-options"><i class="ion-trash-a"></i></span>
    </div>`;

      $firstComment.before($comment);
    });

    $commentsSection.addEventListener('click', async (e) => {
      const target = e.target as HTMLElement;
      if (!target.classList.contains('mod-options') && !target.classList.contains('ion-trash-a')) return;
      
      let commentId: number = 0;
      let idOwningNode: HTMLDivElement;

      if (target.classList.contains('mod-options')) {
        const parentNode = target.parentNode as HTMLDivElement;
        idOwningNode = parentNode.parentNode as HTMLDivElement;
        commentId = +idOwningNode.id;
      } else {
        const parentNode = target.parentNode as HTMLSpanElement;
        const grandParentNode = parentNode.parentNode as HTMLDivElement;
        idOwningNode = grandParentNode.parentNode as HTMLDivElement;
        commentId = +idOwningNode.id;
      }
      
      try {

        const res = await axios.delete(`https://conduit.productionready.io/api/articles/${nowSlug}/comments/${commentId}`, {
          headers: {
            Authorization: `Token ${this.USER_TOKEN}`
          }
        });
        
        if (res.status === 200) idOwningNode.remove();
      } catch(error) {
        throw new Error(error);
      }
    });
  }
}

export default Article;

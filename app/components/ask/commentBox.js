import React, { PureComponent } from 'react';
import { StyleSheet, View, TouchableOpacity, TextInput, Image, ViewPropTypes, Platform } from 'react-native';
import PropTypes from 'prop-types';
import { trans } from '@lang/i18n';
import { Colors } from '@theme';
import { Loading } from '@components/common';
import { AppText } from '@components/utils/texts';

const styles = StyleSheet.create({
  footer: {
    backgroundColor: Colors.background.fullWhite,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
  footerCommentSection: {
    height: 58,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 10,
  },
  actions: {
    height: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border.lightGray,
  },
  action: {
    flexBasis: '32.33%',
    width: '33.33%',
    paddingVertical: 10,
  },
  divider: {
    height: '60%',
    width: 1,
    backgroundColor: Colors.background.lightGray,
  },
  actionText: {
    textAlign: 'center',
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    paddingHorizontal: 18,
  },
  commentInput: {
    height: Platform.OS === 'ios' ? 'auto' : '100%',
    flex: 1,
    fontFamily: 'SFUIText-Regular',
    fontSize: 14,
    paddingRight: 12,
    textAlignVertical: 'center',
  },
  send: {
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  sendText: {
    color: Colors.text.blue,
    fontWeight: 'bold',
  },
});

class CommentBox extends PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      writing: false,
      text: '',
      offset: 0,
    };
  }

  handleChange = text => this.setState({ text })

  handleBlur = () => {
    this.setState({ writing: false });
  };

  handleFocus = () => {
    this.setState({ writing: true });
  };

  handleSuggest = () => {
    const { onSuggest } = this.props;
    const { text } = this.state;
    onSuggest(true, text);
    this.setState({ text: '' });
  }

  handleOffer = () => {
    const { onOffer } = this.props;
    const { text } = this.state;
    onOffer(text);
    this.setState({ text: '' });
  }

  sendComment = () => {
    const { text } = this.state;
    const { handleSend } = this.props;
    handleSend(text);
    this.setState({ text: '' });
  };

  renderOption = () => {
    const { handleShowOptions } = this.props;
    const { writing } = this.state;

    if (writing) {
      return null;
    }

    return (
      <TouchableOpacity
        style={styles.iconWrapper}
        onPress={handleShowOptions}
      >
        <Image source={require('@assets/icons/ic_options.png')} style={styles.moreIcon} />
      </TouchableOpacity>
    );
  }

  renderCalendar = () => {
    const { hasCalender, handleShowCalender } = this.props;
    const { writing } = this.state;

    if (!writing && hasCalender) {
      return (
        <TouchableOpacity
          style={styles.iconWrapper}
          onPress={() => handleShowCalender(true)}
        >
          <Image source={require('@assets/icons/ic_calender.png')} style={styles.moreIcon} />
        </TouchableOpacity>
      );
    }
    return null;
  }

  renderInput = () => {
    const { loading } = this.props;
    const { text } = this.state;

    return (
      <TextInput
        value={text}
        onChangeText={this.handleChange}
        onFocus={this.handleFocus}
        onBlur={this.handleBlur}
        placeholderTextColor="#000"
        placeholder={trans('global.write')}
        multiline
        underlineColorAndroid="transparent"
        autoCorrect={false}
        autoCapitalize={'none'}
        returnKeyType={'done'}
        style={styles.commentInput}
        editable={!loading}
      />
    );
  }

  renderFooter = () => {
    const { loading } = this.props;

    if (loading) {
      return null;
    }

    return (
      <View style={styles.actions} >
        <TouchableOpacity
          onPress={this.handleSuggest}
          style={styles.action}
        >
          <AppText size={13} color={Colors.text.blue} fontVariation="semibold" centered>{trans('global.suggest_a_ride')}</AppText>
        </TouchableOpacity>
        <View style={styles.divider} />
        <TouchableOpacity
          onPress={this.handleOffer}
          style={styles.action}
        >
          <AppText size={13} color={Colors.text.blue} fontVariation="semibold" centered>{trans('global.offer_a_ride')}</AppText>
        </TouchableOpacity>
        <View style={styles.divider} />
        <TouchableOpacity
          onPress={this.sendComment}
          style={styles.action}
        >
          <AppText size={13} color={Colors.text.blue} fontVariation="semibold" centered>{trans('global.comment')}</AppText>
        </TouchableOpacity>
      </View>
    );
  }

  render() {
    const { style, loading } = this.props;
    const { offset, writing } = this.state;

    return (
      <View style={[styles.footer, { bottom: offset }, style]}>
        {writing && this.renderFooter()}
        <View style={styles.footerCommentSection}>
          {this.renderOption()}
          {this.renderCalendar()}
          {this.renderInput()}
          {loading && <Loading />}
        </View>
      </View>
    );
  }
}

CommentBox.propTypes = {
  loading: PropTypes.bool,
  style: ViewPropTypes.style,
  handleSend: PropTypes.func.isRequired,
  handleShowOptions: PropTypes.func,
  hasCalender: PropTypes.bool,
  handleShowCalender: PropTypes.func,
  onSuggest: PropTypes.func.isRequired,
  onOffer: PropTypes.func.isRequired,
};

CommentBox.defaultProps = {
  loading: false,
  style: {},
  handleShowOptions: () => { },
  hasCalender: false,
  handleShowCalender: () => { },
};

export default CommentBox;
